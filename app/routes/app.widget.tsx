import { useState } from 'react';
import { data } from 'react-router';
import prisma from '../db.server';

export const loader = async () => {
  try {
    let settings = await (prisma as any).rewardSettings.findFirst();
    if (!settings) {
      settings = await (prisma as any).rewardSettings.create({
        data: {
          defaultAmount: 5000,
          defaultPercentage: 0,
          valueType: 'fixed',
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
    return data({ settings });
  } catch (error) {
    console.error('Error loading widget settings:', error);
    return data({ settings: null }, { status: 500 });
  }
};

export const action = async ({ request }: any) => {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      widgetTitle,
      widgetSubtitle,
      widgetButtonLabel,
      widgetModalTitle,
      widgetModalBody,
      backgroundColor,
      accentColor,
      textColor,
      borderRadius,
      designStyle,
      buttonColor,
      buttonTextColor,
      widgetStep1Text,
      widgetStep2Text,
      widgetStep3Text,
    } = body;

    let settings = await (prisma as any).rewardSettings.findFirst();
    const updateData: any = {
      widgetTitle: widgetTitle?.toString()?.slice(0, 120) || '🎁 Del & Få Rabat',
      widgetSubtitle: widgetSubtitle?.toString()?.slice(0, 200) || 'Del din ordre på sociale medier og få din reward',
      widgetButtonLabel: widgetButtonLabel?.toString()?.slice(0, 60) || 'Læs mere',
      widgetModalTitle: widgetModalTitle?.toString()?.slice(0, 120) || '🎁 Del & Få Rabat',
      widgetModalBody: widgetModalBody?.toString()?.slice(0, 300) || 'Upload et screenshot af din story, så sender vi din reward',
      backgroundColor: backgroundColor?.toString() || '#a855f7',
      accentColor: accentColor?.toString() || '#ec4899',
      textColor: textColor?.toString() || '#ffffff',
      buttonColor: buttonColor?.toString() || '#a855f7',
      buttonTextColor: buttonTextColor?.toString() || '#ffffff',
      borderRadius: parseInt(borderRadius) || 8,
      designStyle: designStyle?.toString() || 'gradient',
      widgetStep1Text: widgetStep1Text?.toString()?.slice(0, 120) || '1. Del din ordre på sociale medier',
      widgetStep2Text: widgetStep2Text?.toString()?.slice(0, 120) || '2. Upload et screenshot af din story',
      widgetStep3Text: widgetStep3Text?.toString()?.slice(0, 120) || '3. Modtag din reward!',
    };

    if (settings) {
      settings = await (prisma as any).rewardSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await (prisma as any).rewardSettings.create({ data: updateData });
    }

    return new Response(JSON.stringify({ success: true, settings }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error saving widget settings:', error, error?.stack || '', error?.message || '');
    return new Response(JSON.stringify({ error: 'Fejl ved gemning af widget-tekster', details: error?.message || error?.toString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default function WidgetSettings({ loaderData }: any) {
  const { settings } = loaderData as any;
  const [widgetTitle, setWidgetTitle] = useState(settings?.widgetTitle || '🎁 Del & Få Rabat');
  const [widgetSubtitle, setWidgetSubtitle] = useState(settings?.widgetSubtitle || 'Del din ordre på sociale medier og få din reward');
  const [widgetButtonLabel, setWidgetButtonLabel] = useState(settings?.widgetButtonLabel || 'Læs mere');
  const [widgetModalTitle, setWidgetModalTitle] = useState(settings?.widgetModalTitle || '🎁 Del & Få Rabat');
  const [widgetModalBody, setWidgetModalBody] = useState(settings?.widgetModalBody || 'Upload et screenshot af din story, så sender vi din reward');
  const [backgroundColor, setBackgroundColor] = useState(settings?.backgroundColor || '#a855f7');
  const [accentColor, setAccentColor] = useState(settings?.accentColor || '#ec4899');
  const [buttonColor, setButtonColor] = useState(settings?.buttonColor || '#ffffff');
  const [buttonTextColor, setButtonTextColor] = useState(settings?.buttonTextColor || '#a855f7');
  const [textColor, setTextColor] = useState(settings?.textColor || '#ffffff');
  const [borderRadius, setBorderRadius] = useState(settings?.borderRadius || 8);
  const [designStyle, setDesignStyle] = useState(settings?.designStyle || 'gradient');
  const [widgetStep1Text, setWidgetStep1Text] = useState(settings?.widgetStep1Text || '1. Del din ordre på sociale medier');
  const [widgetStep2Text, setWidgetStep2Text] = useState(settings?.widgetStep2Text || '2. Upload et screenshot af din story');
  const [widgetStep3Text, setWidgetStep3Text] = useState(settings?.widgetStep3Text || '3. Modtag din reward!');
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    try {
      const response = await fetch(window.location.href, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetTitle,
          widgetSubtitle,
          widgetButtonLabel,
          widgetModalTitle,
          widgetModalBody,
          backgroundColor,
          accentColor,
          textColor,
          borderRadius,
          designStyle,
          buttonColor,
          buttonTextColor,
          widgetStep1Text,
          widgetStep2Text,
          widgetStep3Text,
        }),
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Fejl ved gemning');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Fejl ved gemning');
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.header}>
        <h1>Widget Tekster</h1>
        <p>Tilpas teksten som kunderne ser i widgetten</p>
      </div>

      <div style={styles.contentContainer}>
        <div style={styles.settingsPanel}>
          <div style={styles.card}>
            <div style={{ ...styles.inputGroup, flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <div>
                <label style={styles.label}>Titel</label>
                <input
                  type="text"
                  value={widgetTitle}
                  maxLength={120}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Undertekst</label>
                <input
                  type="text"
                  value={widgetSubtitle}
                  maxLength={200}
                  onChange={(e) => setWidgetSubtitle(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Knaptekst</label>
                <input
                  type="text"
                  value={widgetButtonLabel}
                  maxLength={60}
                  onChange={(e) => setWidgetButtonLabel(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Pop-up Trin 1</label>
                <input
                  type="text"
                  value={widgetStep1Text}
                  maxLength={120}
                  onChange={(e) => setWidgetStep1Text(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Pop-up Trin 2</label>
                <input
                  type="text"
                  value={widgetStep2Text}
                  maxLength={120}
                  onChange={(e) => setWidgetStep2Text(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Pop-up Trin 3</label>
                <input
                  type="text"
                  value={widgetStep3Text}
                  maxLength={120}
                  onChange={(e) => setWidgetStep3Text(e.target.value)}
                  style={{ ...styles.input, maxWidth: 340 }}
                />
              </div>

              <div>
                <label style={styles.label}>Modal titel</label>
                <input
                  type="text"
                  value={widgetModalTitle}
                  maxLength={120}
                  onChange={(e) => setWidgetModalTitle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Modal tekst</label>
                <textarea
                  value={widgetModalBody}
                  maxLength={300}
                  onChange={(e) => setWidgetModalBody(e.target.value)}
                  style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h2>Design</h2>
            <div style={{ ...styles.inputGroup, flexDirection: 'column', alignItems: 'stretch', gap: '10px' }}>
              <div>
                <label style={styles.label}>Design Style</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['gradient', 'solid', 'outline'].map((style) => (
                    <label key={style} style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="designStyle"
                        value={style}
                        checked={designStyle === style}
                        onChange={(e) => setDesignStyle(e.target.value)}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{style}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label style={styles.label}>Primær Farve</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={backgroundColor}
                    onChange={(e) => setBackgroundColor(e.target.value)}
                    style={{ width: '60px', height: '40px', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>{backgroundColor}</span>
                </div>
              </div>

              <div>
                <label style={styles.label}>Tekstfarve</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    style={{ width: '60px', height: '40px', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>{textColor}</span>
                </div>
              </div>

              <div>
                <label style={styles.label}>Knap Baggrund</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={buttonColor}
                    onChange={(e) => setButtonColor(e.target.value)}
                    style={{ width: '60px', height: '40px', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>{buttonColor}</span>
                </div>
              </div>

              <div>
                <label style={styles.label}>Knap Tekstfarve</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={buttonTextColor}
                    onChange={(e) => setButtonTextColor(e.target.value)}
                    style={{ width: '60px', height: '40px', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '14px', color: '#666' }}>{buttonTextColor}</span>
                </div>
              </div>

              {designStyle === 'gradient' && (
                <div>
                  <label style={styles.label}>Akcentfarve</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      style={{ width: '60px', height: '40px', border: '1px solid #e0e0e0', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '14px', color: '#666' }}>{accentColor}</span>
                  </div>
                </div>
              )}

              <div>
                <label style={styles.label}>Afrunding: {borderRadius}px</label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {saved && (
            <div style={styles.successMessage}>
              ✓ Indstillinger gemt!
            </div>
          )}

          <button onClick={handleSave} style={styles.saveBtn}>
            Gem Widget Ændringer
          </button>
        </div>

        <div style={styles.previewPanel}>
          <h2 style={{ marginTop: '0' }}>Forhåndsvisning</h2>
          <div
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              borderRadius: '8px',
              marginBottom: '16px',
            }}
          >
            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '12px', fontWeight: 'bold' }}>Som det vises på produktsiden:</p>
            <div
              style={{
                padding: '16px',
                borderRadius: `${borderRadius}px`,
                background: designStyle === 'gradient' 
                  ? `linear-gradient(135deg, ${backgroundColor} 0%, ${accentColor} 100%)`
                  : designStyle === 'solid'
                  ? backgroundColor
                  : 'transparent',
                border: designStyle === 'outline' ? `2px solid ${backgroundColor}` : 'none',
                textAlign: 'center',
                color: textColor,
                minHeight: '150px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                fontSize: '14px',
              }}
            >
              <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>{widgetTitle}</h3>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', opacity: 0.95 }}>{widgetSubtitle}</p>
              <button
                style={{
                  background: 'white',
                  color: backgroundColor,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '13px',
                  alignSelf: 'center',
                }}
              >
                {widgetButtonLabel}
              </button>
            </div>
          </div>

          {/* Pop-up preview */}
          <div
            style={{
              marginTop: '24px',
              background: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
              padding: '28px 20px',
              maxWidth: 340,
              marginLeft: 'auto',
              marginRight: 'auto',
              textAlign: 'center',
            }}
          >
            <h4 style={{ margin: '0 0 18px 0', fontSize: '17px', fontWeight: 600 }}>{widgetModalTitle}</h4>
            <div style={{ marginBottom: 18, color: '#444', fontSize: 15 }}>{widgetModalBody}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start', margin: '0 auto', maxWidth: 260 }}>
              <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '8px 12px', width: '100%', color: '#222', fontSize: 14 }}>{widgetStep1Text}</div>
              <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '8px 12px', width: '100%', color: '#222', fontSize: 14 }}>{widgetStep2Text}</div>
              <div style={{ background: '#f3f4f6', borderRadius: 6, padding: '8px 12px', width: '100%', color: '#222', fontSize: 14 }}>{widgetStep3Text}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: any = {
  pageContainer: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    marginBottom: '32px',
    maxWidth: '1200px',
    margin: '0 auto 32px',
  },
  contentContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 480px',
    gap: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  settingsPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  previewPanel: {
    position: 'sticky',
    top: '24px',
    backgroundColor: '#fff',
    padding: '32px',
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    height: 'fit-content',
    minWidth: 420,
    maxWidth: 520,
  },
  card: {
    backgroundColor: '#fff',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
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
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    fontSize: '14px',
    maxWidth: 340,
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
