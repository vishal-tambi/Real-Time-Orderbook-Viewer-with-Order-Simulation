# Real-Time Orderbook Viewer

A Next.js application that displays real-time orderbook data from multiple cryptocurrency exchanges (OKX, Bybit, Deribit) with order simulation capabilities.

## 🚀 Features

- **Real-time Orderbook Display**: Live data from OKX, Bybit, and Deribit
- **Order Simulation**: Simulate orders and see their market impact
- **Market Depth Charts**: Visual representation of orderbook depth
- **Multi-Exchange Support**: Switch between exchanges seamlessly
- **Responsive Design**: Works on desktop and mobile
- **WebSocket Connections**: Real-time updates with fallback to REST APIs
- **Order Impact Analysis**: Calculate slippage, market impact, and fill estimates

## 📦 Quick Setup

### 1. Create Project

```bash
# Create Next.js project
npx create-next-app@latest orderbook-viewer --typescript --tailwind --eslint --app
cd orderbook-viewer

# Install dependencies
npm install zustand recharts react-hook-form zod @hookform/resolvers lucide-react clsx class-variance-authority
```

### 2. Project Structure

Create the following folder structure:

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── api/orderbook/route.ts
├── components/
│   ├── ui/
│   ├── orderbook/
│   ├── forms/
│   └── layout/
├── lib/
├── store/
└── types/
```

### 3. Copy Code Files

Copy all the provided code files into their respective locations according to the file structure above.

### 4. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 🔧 Configuration

### WebSocket Endpoints

The application connects to the following WebSocket endpoints:

- **OKX**: `wss://ws.okx.com:8443/ws/v5/public`
- **Bybit**: `wss://stream.bybit.com/v5/public/linear`
- **Deribit**: `wss://www.deribit.com/ws/api/v2`

### Supported Symbols

Popular trading pairs are supported:
- BTC-USDT, ETH-USDT (OKX, Bybit)
- BTC-USD, ETH-USD (Deribit)
- SOL-USDT, DOGE-USDT

## 🎯 Usage

### 1. Select Exchange and Symbol
- Choose from OKX, Bybit, or Deribit
- Enter a trading pair (e.g., BTC-USDT)
- Connection status is shown with indicators

### 2. View Real-time Orderbook
- See live bid/ask levels with quantities
- Color-coded price levels (green for bids, red for asks)
- Spread and mid-price information

### 3. Simulate Orders
- Fill out the order form with:
  - Exchange and symbol
  - Buy/Sell side
  - Market/Limit order type
  - Price and quantity
  - Timing delay
- View order impact analysis:
  - Estimated fill percentage
  - Average fill price
  - Slippage calculation
  - Market impact assessment

### 4. Analyze Market Depth
- Visual depth chart showing cumulative liquidity
- Bid/ask volume distribution
- Market structure visualization

## 🔍 Key Components

### OrderbookTable
- Displays real-time orderbook data
- Shows 15 levels of bids and asks
- Highlights simulated order positions
- Responsive design with proper formatting

### OrderForm
- Order simulation form with validation
- Real-time impact calculations
- Market/limit order support
- Warning system for high-impact orders

### MarketDepthChart
- Interactive depth visualization
- Cumulative volume display
- Real-time updates

### WebSocket Manager
- Handles multiple exchange connections
- Auto-reconnection logic
- Message parsing and normalization
- Error handling and fallbacks

## 📊 Order Impact Calculations

The application calculates several metrics for order simulation:

- **Fill Percentage**: How much of the order can be filled
- **Average Fill Price**: Weighted average execution price
- **Slippage**: Price deviation from best available price
- **Market Impact**: Percentage of orderbook depth consumed
- **Total Cost**: Complete order execution cost

## 🛠️ Technical Details

### State Management
- Zustand for global state management
- Real-time orderbook updates
- Simulated order tracking

### WebSocket Handling
- Exchange-specific message parsing
- Connection status tracking
- Automatic reconnection
- Graceful degradation to REST APIs

### Performance Optimizations
- Efficient re-rendering with React.memo
- Debounced update calculations
- Optimized chart rendering
- Memory-efficient WebSocket management

## 🚨 Error Handling

- Connection failure recovery
- API rate limiting handling
- Invalid symbol/exchange handling
- Network interruption management
- User-friendly error messages

## 🔮 Future Enhancements

- [ ] Historical orderbook data
- [ ] Advanced order types (Stop, OCO)
- [ ] Portfolio simulation
- [ ] Trade execution APIs
- [ ] Mobile app version
- [ ] Advanced charting tools

## 📝 Notes

- This is a simulation tool for educational purposes
- No real orders are placed
- WebSocket connections are free tier (rate limited)
- All calculations are estimates based on current market data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

MIT License - see LICENSE file for details