import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { kv } from '@vercel/kv';
import { analyzeSymbol, getTrendingPairs, getTopGainers, getVolumeSurge } from '@/app/lib/analysis';

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { webHook: true });

// Helper function to format analysis result to string
function formatAnalysisResult(analysis: any) {
  return `📊 Analysis for ${analysis.symbol}\n\n` +
         `Current Price: $${analysis.price.toFixed(2)}\n` +
         `24h Change: ${analysis.change24h.toFixed(2)}%\n\n` +
         `Technical Indicators:\n` +
         `RSI: ${analysis.indicators.rsi.toFixed(2)}\n` +
         `MACD: ${analysis.indicators.macd.MACD.toFixed(4)}\n\n` +
         `Signals:\n${analysis.signals.join('\n')}\n\n` +
         `Signal Confidence: ${analysis.confidence}%`;
}

export async function POST(req: Request) {
  try {
    const update = await req.json();
    
    if (!update.message?.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = update.message.chat.id;
    const messageText = update.message.text;
    const command = messageText.split(' ')[0];
    const args = messageText.split(' ').slice(1);

    // Store user interaction for dashboard
    await kv.lpush(`user:${chatId}:history`, {
      command: messageText,
      timestamp: Date.now()
    });

    let responseText = '';

    switch (command) {
      case '/start':
        responseText = `🚀 Welcome to Crypto Trading Signals Bot!

Available Commands:
/trending - Get hot trending pairs
/analyze <symbol> - Full analysis of a trading pair
/gainers - Top gaining coins in 24h
/volume - Coins with unusual volume
/alerts <symbol> <price> - Set price alert

Example: /analyze BTCUSDT

Visit our dashboard: ${process.env.VERCEL_URL}`;
        break;

      case '/trending':
        const trending = await getTrendingPairs();
        responseText = '🔥 Trending Trading Pairs:\n\n';
        trending.forEach(coin => {
          responseText += `• ${coin.symbol}/USDT\n`;
          responseText += `  Price (BTC): ${coin.price_btc.toFixed(8)}\n`;
          responseText += `  ${coin.volume_24h ? `24h Volume: $${coin.volume_24h.toLocaleString()}\n` : ''}`;
          responseText += '\n';
        });
        break;

      case '/analyze':
        if (!args[0]) {
          responseText = '⚠️ Please provide a symbol. Example: /analyze BTCUSDT';
        } else {
          const symbol = args[0].toUpperCase();
          const analysis = await analyzeSymbol(symbol);
          responseText = formatAnalysisResult(analysis);
          
          // Store analysis in KV for dashboard
          await kv.set(`analysis:${symbol}`, analysis);
        }
        break;

      case '/gainers':
        const gainers = await getTopGainers();
        responseText = '📈 Top Gainers (24h):\n\n';
        gainers.forEach(coin => {
          responseText += `• ${coin.symbol}/USDT\n`;
          responseText += `  Price: $${coin.price.toFixed(4)}\n`;
          responseText += `  24h Change: +${coin.change_24h.toFixed(1)}%\n`;
          responseText += `  Volume: $${coin.volume_24h.toLocaleString()}\n\n`;
        });
        break;

      case '/volume':
        const volumeData = await getVolumeSurge();
        responseText = '📊 High Volume Coins:\n\n';
        volumeData.forEach(coin => {
          responseText += `• ${coin.symbol}/USDT\n`;
          responseText += `  Price: $${coin.price.toFixed(4)}\n`;
          responseText += `  Volume: $${coin.volume_24h.toLocaleString()}\n`;
          if ('volume_market_cap_ratio' in coin) {
            responseText += `  Volume/MCap: ${coin.volume_market_cap_ratio}%\n`;
          }
          responseText += '\n';
        });
        break;

      case '/alerts':
        if (args.length < 2) {
          responseText = '⚠️ Please provide symbol and price. Example: /alerts BTCUSDT 50000';
        } else {
          const [symbol, price] = args;
          await kv.set(`alert:${chatId}:${symbol}`, {
            price: parseFloat(price),
            timestamp: Date.now()
          });
          responseText = `✅ Alert set for ${symbol} at $${price}`;
        }
        break;

      default:
        responseText = 'Unknown command. Type /start to see available commands.';
    }

    // Send response to Telegram
    await bot.sendMessage(chatId, responseText);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// Required for Vercel
export const runtime = 'edge';