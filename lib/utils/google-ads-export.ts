interface Headline {
  text: string;
  char_count: number;
  keyword_included: boolean;
}

interface Description {
  text: string;
  char_count: number;
  keyword_included: boolean;
  has_cta: boolean;
}

interface Sitelink {
  link_text: string;
  char_count: number;
  description_1: string;
  description_1_chars: number;
  description_2: string;
  description_2_chars: number;
  suggested_url: string;
}

interface Callout {
  text: string;
  char_count: number;
}

interface SnippetValue {
  text: string;
  char_count: number;
}

interface StructuredSnippet {
  header: string;
  values: SnippetValue[];
}

interface GoogleAdsCampaign {
  headlines: {
    price_focused: Headline[];
    social_proof: Headline[];
    authority: Headline[];
  };
  descriptions: Description[];
  sitelinks: Sitelink[];
  callouts: Callout[];
  structured_snippets: StructuredSnippet[];
  target_keywords?: {
    primary: string;
    secondary: string[];
    match_type: string;
  };
}

/**
 * Export Google Ads campaign to CSV format for Google Ads Editor bulk upload
 */
export function exportGoogleAdsToCsv(campaign: GoogleAdsCampaign, campaignName = 'Campaign'): string {
  const rows: string[][] = [];

  // Add header row
  rows.push([
    'Campaign',
    'Ad Group',
    'Ad Type',
    'Headline 1',
    'Headline 2',
    'Headline 3',
    'Headline 4',
    'Headline 5',
    'Headline 6',
    'Headline 7',
    'Headline 8',
    'Headline 9',
    'Headline 10',
    'Headline 11',
    'Headline 12',
    'Headline 13',
    'Headline 14',
    'Headline 15',
    'Description 1',
    'Description 2',
    'Description 3',
    'Description 4',
    'Description 5',
  ]);

  // Flatten all headlines
  const allHeadlines = [
    ...campaign.headlines.price_focused,
    ...campaign.headlines.social_proof,
    ...campaign.headlines.authority,
  ];

  // Add responsive search ad row
  const adRow = [
    campaignName,
    'Ad Group 1',
    'Responsive Search Ad',
    ...allHeadlines.map(h => h.text),
    ...Array(15 - allHeadlines.length).fill(''),
    ...campaign.descriptions.map(d => d.text),
    ...Array(5 - campaign.descriptions.length).fill(''),
  ];
  rows.push(adRow);

  // Add sitelinks section
  if (campaign.sitelinks.length > 0) {
    rows.push([]); // Empty row
    rows.push(['Sitelink Extensions']);
    rows.push(['Campaign', 'Link Text', 'Description 1', 'Description 2', 'Final URL']);

    campaign.sitelinks.forEach(sitelink => {
      rows.push([
        campaignName,
        sitelink.link_text,
        sitelink.description_1,
        sitelink.description_2,
        sitelink.suggested_url,
      ]);
    });
  }

  // Add callouts section
  if (campaign.callouts.length > 0) {
    rows.push([]); // Empty row
    rows.push(['Callout Extensions']);
    rows.push(['Campaign', 'Callout Text']);

    campaign.callouts.forEach(callout => {
      rows.push([campaignName, callout.text]);
    });
  }

  // Add structured snippets section
  if (campaign.structured_snippets.length > 0) {
    rows.push([]); // Empty row
    rows.push(['Structured Snippet Extensions']);
    rows.push(['Campaign', 'Header', 'Values']);

    campaign.structured_snippets.forEach(snippet => {
      const values = snippet.values.map(v => v.text).join(', ');
      rows.push([campaignName, snippet.header, values]);
    });
  }

  // Add keywords section if available
  if (campaign.target_keywords) {
    rows.push([]); // Empty row
    rows.push(['Keywords']);
    rows.push(['Campaign', 'Ad Group', 'Keyword', 'Match Type']);

    // Add primary keyword
    rows.push([
      campaignName,
      'Ad Group 1',
      campaign.target_keywords.primary,
      campaign.target_keywords.match_type,
    ]);

    // Add secondary keywords
    campaign.target_keywords.secondary.forEach(keyword => {
      rows.push([
        campaignName,
        'Ad Group 1',
        keyword,
        campaign.target_keywords!.match_type,
      ]);
    });
  }

  // Convert to CSV string
  return rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

/**
 * Format Google Ads campaign for manual copy-paste
 */
export function formatGoogleAdsForCopy(campaign: GoogleAdsCampaign): string {
  let output = '=== GOOGLE SEARCH AD CAMPAIGN ===\n\n';

  // Headlines
  output += '=== HEADLINES (15) ===\n\n';
  output += 'Price-Focused:\n';
  campaign.headlines.price_focused.forEach((h, i) => {
    output += `${i + 1}. ${h.text}\n`;
  });
  output += '\nSocial Proof:\n';
  campaign.headlines.social_proof.forEach((h, i) => {
    output += `${i + 1}. ${h.text}\n`;
  });
  output += '\nAuthority:\n';
  campaign.headlines.authority.forEach((h, i) => {
    output += `${i + 1}. ${h.text}\n`;
  });

  // Descriptions
  output += '\n=== DESCRIPTIONS (5) ===\n\n';
  campaign.descriptions.forEach((d, i) => {
    output += `${i + 1}. ${d.text}\n`;
  });

  // Sitelinks
  if (campaign.sitelinks.length > 0) {
    output += '\n=== SITELINKS ===\n\n';
    campaign.sitelinks.forEach((s, i) => {
      output += `${i + 1}. ${s.link_text}\n`;
      output += `   - ${s.description_1}\n`;
      output += `   - ${s.description_2}\n`;
      output += `   - URL: ${s.suggested_url}\n\n`;
    });
  }

  // Callouts
  if (campaign.callouts.length > 0) {
    output += '=== CALLOUTS ===\n\n';
    campaign.callouts.forEach((c, i) => {
      output += `${i + 1}. ${c.text}\n`;
    });
  }

  // Structured Snippets
  if (campaign.structured_snippets.length > 0) {
    output += '\n=== STRUCTURED SNIPPETS ===\n\n';
    campaign.structured_snippets.forEach((s, i) => {
      output += `${i + 1}. ${s.header}: `;
      output += s.values.map(v => v.text).join(', ') + '\n';
    });
  }

  // Keywords
  if (campaign.target_keywords) {
    output += '\n=== KEYWORDS ===\n\n';
    output += `Primary: ${campaign.target_keywords.primary} (${campaign.target_keywords.match_type})\n`;
    if (campaign.target_keywords.secondary.length > 0) {
      output += '\nSecondary:\n';
      campaign.target_keywords.secondary.forEach((k, i) => {
        output += `${i + 1}. ${k} (${campaign.target_keywords!.match_type})\n`;
      });
    }
  }

  return output;
}

/**
 * Download CSV file
 */
export function downloadCsv(csvContent: string, filename = 'google-ads-campaign.csv') {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
