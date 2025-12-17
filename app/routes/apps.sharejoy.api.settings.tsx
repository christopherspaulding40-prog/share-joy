import { data } from 'react-router';
import type { Route } from './+types/apps.sharejoy.api.settings';
import prisma from '../db.server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function loader({ request }: Route.LoaderArgs) {
  if (request.method === 'OPTIONS') {
    return data(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Hent reward settings fra database
    let settings = await prisma.rewardSettings.findFirst();

    // Opret default hvis ingen findes
    if (!settings) {
      settings = await prisma.rewardSettings.create({
        data: {
          defaultAmount: 5000,
          defaultPercentage: 0,
          valueType: 'fixed',
          rewardType: 'cashback',
          currency: 'DKK',
          widgetTitle: '🎁 Del & Få Rabat',
          widgetSubtitle: 'Del din ordre på sociale medier og få din reward',
          widgetButtonLabel: 'Læs mere',
          widgetModalTitle: '🎁 Del & Få Rabat',
          widgetModalBody: 'Upload et screenshot af din story, så sender vi din reward',
          backgroundColor: '#a855f7',
          accentColor: '#ec4899',
          textColor: '#ffffff',
          buttonColor: '#a855f7',
          buttonTextColor: '#ffffff',
          borderRadius: 8,
          designStyle: 'gradient',
        },
      });
    }

    // Returner kun det nødvendige til widgetten
    return data(
      {
        success: true,
        settings: {
          rewardType: settings.rewardType,
          valueType: settings.valueType,
          amount: settings.defaultAmount / 100,
          percentage: settings.defaultPercentage,
          currency: settings.currency,
          widgetTitle: settings.widgetTitle,
          widgetSubtitle: settings.widgetSubtitle,
          widgetButtonLabel: settings.widgetButtonLabel,
          widgetModalTitle: settings.widgetModalTitle,
          widgetModalBody: settings.widgetModalBody,
          backgroundColor: settings.backgroundColor,
          accentColor: settings.accentColor,
          textColor: settings.textColor,
          buttonColor: settings.buttonColor,
          buttonTextColor: settings.buttonTextColor,
          borderRadius: settings.borderRadius,
          designStyle: settings.designStyle,
          widgetStep1Text: settings.widgetStep1Text,
          widgetStep2Text: settings.widgetStep2Text,
          widgetStep3Text: settings.widgetStep3Text,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error fetching settings:', error);
    return data(
      {
        success: false,
        error: 'Failed to fetch settings',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
