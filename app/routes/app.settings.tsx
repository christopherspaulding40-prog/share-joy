import { useState } from 'react';
import { data } from 'react-router';
import { useFetcher } from 'react-router';
import prisma from '../db.server';

export const loader = async () => {
  try {
    let settings = await (prisma as any).rewardSettings.findFirst();
    if (!settings) {
      settings = await (prisma as any).rewardSettings.create({
        data: {
          rewardType: 'cashback',
          defaultAmount: 5000,
          defaultPercentage: 0,
          valueType: 'fixed', // 'fixed' eller 'percentage'
          voucherType: 'percentage_first_order',
          discountPercentage: 30.0,
          currency: 'DKK',
          widgetTitle: '🎁 Del & Få Rabat',
          widgetSubtitle: 'Del din ordre på sociale medier og få din reward',
          widgetButtonLabel: 'Læs mere',
          widgetModalTitle: '🎁 Del & Få Rabat',
          widgetModalBody: 'Upload et screenshot af din story, så sender vi din reward',
        },
      });
    }
    return data({ settings });
  } catch (error) {
    console.error('Error loading settings:', error);
    return data({ settings: { rewardType: 'cashback', defaultAmount: 5000, defaultPercentage: 0, valueType: 'fixed', voucherType: 'percentage_first_order', discountPercentage: 30.0, currency: 'DKK' } });
  }
};

export const action = async ({ request }: any) => {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { rewardType, defaultAmount, defaultPercentage, valueType, voucherType, discountPercentage } = body;

      console.log('[Settings] Saving:', { rewardType, valueType, voucherType, discountPercentage });

      let settings = await (prisma as any).rewardSettings.findFirst();
      
      const updateData: any = {
        rewardType,
      };

      // For cashback: gem valueType og beløb/procent
      if (rewardType === 'cashback') {
        updateData.valueType = valueType;
        
        if (valueType === 'fixed') {
          updateData.defaultAmount = parseInt(defaultAmount) * 100; // Konverter DKK til øre
          updateData.defaultPercentage = 0;
        } else {
          updateData.defaultPercentage = parseFloat(defaultPercentage);
          updateData.defaultAmount = 0;
        }
      }

      // For voucher: gem voucher type og discount percentage
      if (rewardType === 'voucher') {
        updateData.voucherType = voucherType || 'percentage_first_order';
        updateData.discountPercentage = parseFloat(discountPercentage) || 30;
      }
      
      if (settings) {
        settings = await (prisma as any).rewardSettings.update({
          where: { id: settings.id },
          data: updateData,
        });
      } else {
        settings = await (prisma as any).rewardSettings.create({
          data: updateData,
        });
      }

      return data({ success: true, settings });
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error details:', (error as any)?.message, (error as any)?.stack);
      return data({ 
        error: 'Fejl ved gemning af indstillinger', 
        details: (error as any)?.message 
      }, { status: 500 });
    }
  }

  return data({ error: 'Method not allowed' }, { status: 405 });
};

export default function Settings({ loaderData }: any) {
  const { settings } = loaderData as any;
  const fetcher = useFetcher();
  const [rewardType, setRewardType] = useState(settings?.rewardType || 'cashback');
  const [valueType, setValueType] = useState(settings?.valueType || 'fixed');
  const [defaultAmount, setDefaultAmount] = useState((settings?.defaultAmount || 5000) / 100);
  const [defaultPercentage, setDefaultPercentage] = useState(settings?.defaultPercentage || 10);
  const [voucherType, setVoucherType] = useState(settings?.voucherType || 'percentage_first_order');
  const [discountPercentage, setDiscountPercentage] = useState(settings?.discountPercentage || 30);
  const [saved, setSaved] = useState(false);

  // Reload page when fetcher completes successfully
  if (fetcher.state === 'idle' && fetcher.data?.success && !saved) {
    setSaved(true);
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  const handleSave = () => {
    console.log('[Settings] Saving with values:', {
      rewardType,
      valueType,
      defaultAmount,
      defaultPercentage,
      voucherType,
      discountPercentage,
    });

    fetcher.submit(
      {
        rewardType,
        valueType,
        defaultAmount: String(defaultAmount),
        defaultPercentage: String(defaultPercentage),
        voucherType,
        discountPercentage: String(discountPercentage),
      },
      { method: 'POST', encType: 'application/json' }
    );
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>Reward Indstillinger</h1>
        <p>Konfigurer hvordan rewards skal fungere på din webshop</p>
      </div>

      <div style={styles.card}>
        <h2>Reward Type</h2>
        <p style={styles.description}>Vælg om kunderne får cashback eller voucher når de deler billeder</p>
        
        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="cashback"
              checked={rewardType === 'cashback'}
              onChange={(e) => setRewardType(e.target.value)}
              style={styles.radio}
            />
            <span>Cashback (penge tilbage på konto)</span>
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              value="voucher"
              checked={rewardType === 'voucher'}
              onChange={(e) => setRewardType(e.target.value)}
              style={styles.radio}
            />
            <span>Voucher (rabatkode til næste køb)</span>
          </label>
        </div>
      </div>

      {rewardType === 'voucher' && (
        <div style={styles.card}>
          <h2>Voucher Type</h2>
          <p style={styles.description}>Vælg hvordan voucher-rabatten skal beregnes</p>
          
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="percentage_first_order"
                checked={voucherType === 'percentage_first_order'}
                onChange={(e) => setVoucherType(e.target.value)}
                style={styles.radio}
              />
              <span>Procent af første ordre (f.eks. 30% af 500 DKK = 150 DKK voucher)</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="percentage_next_order"
                checked={voucherType === 'percentage_next_order'}
                onChange={(e) => setVoucherType(e.target.value)}
                style={styles.radio}
              />
              <span>Fast procent rabat på næste køb (f.eks. 30% rabat på hele næste ordre)</span>
            </label>
          </div>

          <div style={{ ...styles.inputGroup, marginTop: '16px' }}>
            <label style={styles.label}>Rabat Procent</label>
            <input
              type="number"
              min="1"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(parseFloat(e.target.value))}
              style={styles.input}
            />
            <span style={styles.currency}>%</span>
          </div>
        </div>
      )}

      {rewardType === 'cashback' && (
        <div style={styles.card}>
          <h2>Reward Værdi</h2>
          <p style={styles.description}>Vælg om kunden får fast beløb eller procent af ordren</p>
          
          <div style={styles.radioGroup}>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="fixed"
                checked={valueType === 'fixed'}
                onChange={(e) => setValueType(e.target.value)}
                style={styles.radio}
              />
              <span>Fast beløb</span>
            </label>
            <label style={styles.radioLabel}>
              <input
                type="radio"
                value="percentage"
                checked={valueType === 'percentage'}
                onChange={(e) => setValueType(e.target.value)}
                style={styles.radio}
              />
              <span>Procent af ordren</span>
            </label>
          </div>

          {valueType === 'fixed' ? (
            <div style={{ ...styles.inputGroup, marginTop: '16px' }}>
              <input
                type="number"
                min="1"
                max="1000"
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(parseInt(e.target.value))}
                style={styles.input}
              />
              <span style={styles.currency}>DKK</span>
            </div>
          ) : (
            <div style={{ ...styles.inputGroup, marginTop: '16px' }}>
              <input
                type="number"
                min="1"
                max="100"
                value={defaultPercentage}
                onChange={(e) => setDefaultPercentage(parseFloat(e.target.value))}
                style={styles.input}
              />
              <span style={styles.currency}>%</span>
            </div>
          )}
        </div>
      )}

      {saved && (
        <div style={styles.successMessage}>
          ✓ Indstillinger gemt!
        </div>
      )}

      <button onClick={handleSave} style={styles.saveBtn}>
        Gem Indstillinger
      </button>
    </div>
  );
}

const styles: any = {
  container: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    maxWidth: '600px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    marginBottom: '24px',
  },
  description: {
    color: '#666',
    marginBottom: '16px',
    fontSize: '14px',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontSize: '14px',
    color: '#333',
    fontWeight: 500,
  },
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '14px',
  },
  radio: {
    marginRight: '8px',
    cursor: 'pointer',
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    flex: 1,
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '14px',
  },
  currency: {
    fontSize: '14px',
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: '#000',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    width: '100%',
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px',
    fontSize: '14px',
  },
};
