# Chart Components Documentation

## Overview

This document describes the reusable chart components built with Recharts for visualizing marketing data. All components follow a consistent design system with smooth animations and loading states.

## Design System

### Colors

**Positive Trends** (Growth, Success):
- Green: `#10b981` (emerald-500)
- Light Green Background: `bg-green-50` / `bg-green-900/20` (dark mode)

**Negative Trends** (Decline, Concerns):
- Red: `#ef4444` (red-500)
- Light Red Background: `bg-red-50` / `bg-red-900/20` (dark mode)

**Neutral**:
- Gray: `#6b7280` (gray-500)
- Light Gray Background: `bg-gray-50` / `bg-gray-900/20` (dark mode)

**Chart Colors**:
- Primary Blue: `#3b82f6` (blue-500)
- Purple: `#8b5cf6` (purple-500)
- Indigo: `#6366f1` (indigo-600)
- Emerald: `#10b981` (emerald-500)

### Animations

All components feature:
- **Smooth transitions**: 300-500ms duration
- **Hover effects**: Scale transforms, shadow changes
- **Loading states**: Skeleton screens with pulse animation
- **Chart animations**: 1000ms duration for data rendering

## Components

### 1. MetricsCard

Enhanced KPI card with trend indicators and loading states.

#### Props

```typescript
interface MetricsCardProps {
  title: string;                    // Card title
  value: string | number;           // Main metric value
  subtitle?: string;                // Optional subtitle/description
  trend?: 'up' | 'down' | 'neutral'; // Trend direction
  trendValue?: string | number;     // Trend value (e.g., "+12.5%")
  icon?: React.ReactNode;           // Optional icon
  loading?: boolean;                // Loading state
}
```

#### Features

- **Hover effects**: Scales 1.02x and increases shadow
- **Trend indicators**: Arrow icons (↑ ↓ →) with color coding
- **Trend badges**: Rounded pills with background color
- **Loading skeleton**: Animated pulse effect
- **Responsive**: Adapts to container width

#### Usage Example

```tsx
<MetricsCard
  title="Total Revenue"
  value="$45,231"
  subtitle="Last 30 days"
  trend="up"
  trendValue="+12.5%"
  icon={<DollarIcon />}
  loading={false}
/>
```

#### Visual States

**Normal State:**
- White background with subtle border
- Large bold value (3xl font)
- Trend indicator aligned right
- Small icon in header

**Loading State:**
- Gray skeleton blocks with pulse animation
- Maintains layout dimensions

**Hover State:**
- Slight scale increase (1.02x)
- Enhanced shadow
- Icon scales 1.1x

### 2. LineChart

Time-series line chart for trend visualization.

#### Props

```typescript
interface LineChartProps {
  data: Array<Record<string, any>>; // Chart data
  lines: Array<{
    dataKey: string;                // Data property to plot
    name: string;                   // Legend label
    color: string;                  // Line color (hex)
    strokeWidth?: number;           // Line thickness (default: 2)
  }>;
  xAxisKey: string;                 // X-axis data property
  title?: string;                   // Chart title
  height?: number;                  // Chart height (default: 300)
  loading?: boolean;                // Loading state
  yAxisFormatter?: (value: any) => string; // Y-axis label formatter
}
```

#### Features

- **Multiple lines**: Support for multiple data series
- **Responsive**: Automatically adjusts to container
- **Interactive tooltip**: Shows values on hover
- **Grid lines**: Dashed grid for easier reading
- **Legend**: Automatic legend generation
- **Smooth curves**: Monotone interpolation
- **Active dots**: Highlights on hover
- **Animation**: 1000ms smooth entrance

#### Usage Example

```tsx
<LineChart
  data={trendData}
  lines={[
    { dataKey: 'clicks', name: 'Clicks', color: '#3b82f6', strokeWidth: 3 },
    { dataKey: 'conversions', name: 'Conversions', color: '#10b981' },
  ]}
  xAxisKey="date"
  title="Performance Trends (Last 14 Days)"
  height={300}
  yAxisFormatter={(value) => formatNumber(value)}
/>
```

#### Data Format

```typescript
const data = [
  { date: 'Nov 1', clicks: 120, conversions: 15 },
  { date: 'Nov 2', clicks: 145, conversions: 18 },
  // ...
];
```

### 3. BarChart

Vertical or horizontal bar chart for comparisons.

#### Props

```typescript
interface BarChartProps {
  data: Array<Record<string, any>>; // Chart data
  bars: Array<{
    dataKey: string;                // Data property to plot
    name: string;                   // Legend label
    color: string;                  // Bar color (hex)
  }>;
  xAxisKey: string;                 // X-axis data property
  title?: string;                   // Chart title
  height?: number;                  // Chart height (default: 300)
  loading?: boolean;                // Loading state
  horizontal?: boolean;             // Horizontal layout (default: false)
  yAxisFormatter?: (value: any) => string; // Y-axis label formatter
}
```

#### Features

- **Vertical or horizontal**: Flexible orientation
- **Multiple bars**: Grouped bar charts supported
- **Rounded corners**: 8px radius for modern look
- **Hover highlights**: Background tint on hover
- **Responsive**: Adjusts to container
- **Compact numbers**: Automatic K/M formatting option
- **Animation**: 1000ms staggered entrance

#### Usage Example

```tsx
<BarChart
  data={campaignData}
  bars={[
    { dataKey: 'conversations', name: 'Conversations', color: '#8b5cf6' },
    { dataKey: 'spend', name: 'Spend ($)', color: '#3b82f6' },
  ]}
  xAxisKey="campaignName"
  title="Campaign Performance Comparison"
  height={300}
  horizontal={false}
  yAxisFormatter={(value) => formatCompactNumber(value)}
/>
```

#### Data Format

```typescript
const data = [
  { campaignName: 'Campaign A', conversations: 85, spend: 450 },
  { campaignName: 'Campaign B', conversations: 120, spend: 680 },
  // ...
];
```

### 4. ConversionFunnel

Visual representation of conversion funnel stages.

#### Props

```typescript
interface FunnelStage {
  name: string;    // Stage name
  value: number;   // Number of users
  color?: string;  // Optional custom color
}

interface ConversionFunnelProps {
  stages: FunnelStage[];  // Array of funnel stages
  title?: string;         // Chart title
  loading?: boolean;      // Loading state
}
```

#### Features

- **Progressive width**: Each stage narrower than previous
- **Color gradient**: Transitions from blue to purple
- **Conversion rates**: Automatic calculation between stages
- **Hover effects**: Shadow and shimmer animation
- **Arrow indicators**: Visual flow between stages
- **Summary stats**: Overall conversion and drop-off rates
- **Responsive**: Adapts to container

#### Usage Example

```tsx
<ConversionFunnel
  stages={[
    { name: 'Ad Impressions', value: 50000, color: 'bg-blue-500' },
    { name: 'Ad Clicks', value: 2500, color: 'bg-blue-600' },
    { name: 'Landing Page Views', value: 2200, color: 'bg-indigo-600' },
    { name: 'Form Submissions', value: 450, color: 'bg-purple-600' },
    { name: 'Conversions', value: 180, color: 'bg-purple-700' },
  ]}
  title="Conversion Funnel"
  loading={false}
/>
```

#### Visual Design

Each stage shows:
- Stage name
- User count
- Conversion rate from previous stage
- Progress bar with shimmer effect
- Connecting arrows between stages

Summary section displays:
- Overall conversion percentage
- Total drop-off rate

## Helper Functions

### Mock Data Generators

Located in `lib/mockData.ts`:

#### `generateTrendData(days: number)`

Generates realistic trend data for line charts.

```typescript
const trendData = generateTrendData(30);
// Returns: [{ date, clicks, impressions, cost, conversions }, ...]
```

#### `generateConversionFunnelData()`

Generates sample conversion funnel data.

```typescript
const funnelData = generateConversionFunnelData();
// Returns: [{ name, value, color }, ...]
```

#### `generateCampaignComparisonData(campaigns)`

Transforms campaign data for bar charts.

```typescript
const comparisonData = generateCampaignComparisonData(metaCampaigns);
// Returns: [{ name, reach, conversations, spend, impressions }, ...]
```

## Formatting Utilities

### Number Formatters

```typescript
// Standard number formatting
const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-US').format(value);
};

// Compact notation (1.2K, 3.5M)
const formatCompactNumber = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
};

// Currency formatting
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};
```

## Responsive Behavior

All components are fully responsive:

### Breakpoints

- **Mobile** (`< 768px`): 1 column grid
- **Tablet** (`768px - 1024px`): 2 column grid
- **Desktop** (`> 1024px`): 4 column grid (metrics), 2 column (campaigns)

### Chart Responsiveness

Charts use `ResponsiveContainer` from Recharts:
- Automatically adapts to parent container width
- Maintains specified height
- Adjusts font sizes and spacing
- Optimizes for touch on mobile

## Dark Mode Support

All components support dark mode:

```css
/* Light mode */
bg-white border-gray-200 text-gray-900

/* Dark mode */
dark:bg-zinc-900 dark:border-zinc-800 dark:text-white
```

Charts automatically adapt:
- Tooltip backgrounds
- Grid line colors
- Text colors
- Border colors

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: Charts only render when in viewport
2. **Memoization**: Use `useMemo` for expensive calculations
3. **Animation Throttling**: Limit animation duration
4. **Data Limiting**: Show only necessary data points

### Example Optimization

```typescript
const trendData = useMemo(() => generateTrendData(14), []);
const campaignData = useMemo(
  () => generateCampaignComparisonData(campaigns),
  [campaigns]
);
```

## Accessibility

All components follow accessibility best practices:

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labeling for screen readers
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Visible focus states
- **Semantic HTML**: Proper heading hierarchy

## Browser Support

Tested and working on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

Potential additions:

- [ ] Export charts as PNG/SVG
- [ ] Drill-down interactions
- [ ] Real-time updates via WebSocket
- [ ] Custom date range pickers
- [ ] Comparison mode (year-over-year)
- [ ] Annotations and markers
- [ ] PDF report generation
- [ ] Chart customization UI
- [ ] Data table toggle
- [ ] Advanced filtering

## Examples in Production

The dashboard currently uses these components:

1. **Google Ads Section**:
   - 4 MetricsCards for KPIs
   - LineChart for performance trends

2. **Meta Ads Section**:
   - 4 MetricsCards for totals
   - BarChart for campaign comparison
   - CampaignCards for detailed breakdown

3. **Conversion Funnel**:
   - ConversionFunnel for customer journey

## Troubleshooting

### Charts Not Rendering

**Issue**: Charts appear blank or don't render

**Solutions**:
- Ensure data format matches expected structure
- Check that `dataKey` values exist in data
- Verify container has non-zero dimensions
- Check for console errors

### Performance Issues

**Issue**: Charts lag or slow page load

**Solutions**:
- Reduce number of data points
- Implement data pagination
- Use `useMemo` for data processing
- Disable animations for large datasets

### Styling Issues

**Issue**: Charts don't match design

**Solutions**:
- Check Tailwind CSS is properly configured
- Verify dark mode classes are working
- Ensure custom CSS doesn't override chart styles
- Check browser dev tools for CSS conflicts

## Support

For questions or issues:
1. Check this documentation
2. Review component source code
3. Check Recharts documentation: https://recharts.org/
4. Review example implementations in `app/page.tsx`
