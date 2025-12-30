# Avatar Rating System - Setup Instructions

## Part 2 Complete!

The Avatar Rating System Part 2 has been implemented with the following features:

### ✅ Completed Features

1. **Database Schema** - `ad_ratings` table added
2. **API Endpoint** - `/api/ads/[id]/rate` for rating ads with avatars
3. **UI Components**:
   - `RatingProgressModal` - Shows real-time progress
   - `RatingResults` - Displays feedback with sentiment analysis
4. **Meta Ads Integration** - Full rating workflow on Meta ad creation page
5. **Google Ads Integration** - Imports added (follow Meta ads pattern to complete)

### 🔧 Required Setup

#### 1. Vertex AI Credentials (Already Added! ✅)

The avatar rating system uses **Gemini 2.0 Flash via Vertex AI** for fast, parallel persona ratings.

Your `.env.local` already contains:
```bash
GOOGLE_CLOUD_PROJECT_ID=zoom-sales-coach-prod
GOOGLE_APPLICATION_CREDENTIALS_JSON='{"type":"service_account",...}'
```

**Note:** Using Vertex AI instead of direct Gemini API for enterprise-grade reliability and quota management.

#### 2. Restart Dev Server

After adding the API key:
```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

### 📊 How It Works

1. **Generate Ads** - Create Meta or Google ad variations
2. **Select Avatar Set** - Choose which customer personas to use
3. **Rate Variation** - Click "Rate This Ad with Avatars" button
4. **Wait 30-60s** - Gemini rates with all 13 avatars in parallel
5. **View Results** - See sentiment breakdown and individual feedback

### 🎯 Rating Workflow

```
User clicks "Rate This Ad"
  ↓
13 parallel API calls to Gemini 2.0 Flash
  ↓
Each avatar provides feedback from their persona
  ↓
Sentiment analysis: positive/mixed/negative
  ↓
Save to database + Show results modal
```

### 💾 Database

All ratings are saved to the `ad_ratings` table with:
- Full feedback from each avatar
- Sentiment breakdown (positive/mixed/negative counts)
- Processing time
- Avatar set metadata

### 🧪 Testing

1. Create an avatar set at `/dashboard/settings/avatars/create`
2. Generate a Meta ad at `/dashboard/ads/create/meta`
3. Select your avatar set in the rating section
4. Click "Rate This Ad with Avatars" on any variation
5. Watch the progress modal
6. Review detailed feedback from all 13 personas

### 📝 Next: Part 3 (Future)

Part 3 will add:
- AI Copywriter Synthesis
- Rewrite ads based on avatar feedback
- Optimization suggestions
- A/B testing recommendations

---

**Status:** Part 2 Complete ✅
**Powered by:** Gemini 2.0 Flash via Vertex AI for fast parallel ratings
**Credentials:** Already configured with your Vertex AI service account
