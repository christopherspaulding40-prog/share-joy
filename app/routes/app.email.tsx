import React from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useFetcher, useLoaderData } from "react-router";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticate.admin(request);
  try {
    const settings = await prisma.rewardSettings.findFirst();
    return {
      emailSubject: settings?.emailSubject || "🎁 Din rabat er klar!",
      emailFromName: settings?.emailFromName || "ShareJoy",
      emailBodyHTML: settings?.emailBodyHTML || "<p>Tak for dit bidrag! Din rabat er klar.</p>",
      emailButtonText: settings?.emailButtonText || "Shop nu",
      emailBrandColor: settings?.emailBrandColor || "#a855f7",
      cashbackEmailSubject: settings?.cashbackEmailSubject || "💰 Din cashback er på vej!",
      cashbackEmailFromName: settings?.cashbackEmailFromName || "ShareJoy",
      cashbackEmailBodyHTML: settings?.cashbackEmailBodyHTML || "<p>Tak for at dele! Vi behandler din cashback.</p>",
      cashbackEmailBrandColor: settings?.cashbackEmailBrandColor || "#10b981",
      cashbackProcessingTime: settings?.cashbackProcessingTime || "3-5 hverdage",
    };
  } catch (e) {
    // Hvis kolonnerne ikke findes endnu (migrering mangler), returnér defaults
    return {
      emailSubject: "🎁 Din rabat er klar!",
      emailFromName: "ShareJoy",
      emailBodyHTML: "<p>Tak for dit bidrag! Din rabat er klar.</p>",
      emailButtonText: "Shop nu",
      emailBrandColor: "#a855f7",
      cashbackEmailSubject: "💰 Din cashback er på vej!",
      cashbackEmailFromName: "ShareJoy",
      cashbackEmailBodyHTML: "<p>Tak for at dele! Vi behandler din cashback.</p>",
      cashbackEmailBrandColor: "#10b981",
      cashbackProcessingTime: "3-5 hverdage",
    };
  }
}

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const form = await request.formData();
  const emailSubject = String(form.get("emailSubject") || "");
  const emailFromName = String(form.get("emailFromName") || "");
  const emailBodyHTML = String(form.get("emailBodyHTML") || "");
  const emailButtonText = String(form.get("emailButtonText") || "");
  const emailBrandColor = String(form.get("emailBrandColor") || "#a855f7");
  const cashbackEmailSubject = String(form.get("cashbackEmailSubject") || "");
  const cashbackEmailFromName = String(form.get("cashbackEmailFromName") || "");
  const cashbackEmailBodyHTML = String(form.get("cashbackEmailBodyHTML") || "");
  const cashbackEmailBrandColor = String(form.get("cashbackEmailBrandColor") || "#10b981");
  const cashbackProcessingTime = String(form.get("cashbackProcessingTime") || "3-5 hverdage");

  try {
    const existing = await prisma.rewardSettings.findFirst();
    if (existing) {
      await prisma.rewardSettings.update({
        where: { id: existing.id },
        data: { 
          emailSubject, 
          emailFromName, 
          emailBodyHTML, 
          emailButtonText, 
          emailBrandColor,
          cashbackEmailSubject,
          cashbackEmailFromName,
          cashbackEmailBodyHTML,
          cashbackEmailBrandColor,
          cashbackProcessingTime,
        },
      });
    } else {
      // Create with safe defaults if table exists; if not, fall through to catch
      await prisma.rewardSettings.create({
        data: {
          emailSubject,
          emailFromName,
          emailBodyHTML,
          emailButtonText,
          emailBrandColor,
          cashbackEmailSubject,
          cashbackEmailFromName,
          cashbackEmailBodyHTML,
          cashbackEmailBrandColor,
          cashbackProcessingTime,
        },
      });
    }
    return { success: true };
  } catch (e) {
    // If columns are missing (migration not run), return a clear error message
    return { success: false, error: 'Database mangler migrering. Kør: npx prisma migrate dev --name add_cashback_email' };
  }
}

export default function EmailSettings() {
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData<typeof loader>();

  const [emailType, setEmailType] = React.useState<'voucher' | 'cashback' | 'reminder'>('voucher');
  // Reminder email state
  const [reminderSubject, setReminderSubject] = React.useState(data.reminderEmailSubject || "🔔 Husk at bruge din rabat!");
  const [reminderFromName, setReminderFromName] = React.useState(data.reminderEmailFromName || "ShareJoy");
  const [reminderBrandColor, setReminderBrandColor] = React.useState(data.reminderEmailBrandColor || "#f59e42");
  const [reminderHtml, setReminderHtml] = React.useState(data.reminderEmailBodyHTML || "<p>Husk at bruge din rabatkode fra ShareJoy!</p>");
  const reminderEditorRef = React.useRef<HTMLDivElement | null>(null);

  // Voucher email state
  const [subject, setSubject] = React.useState(data.emailSubject);
  const [fromName, setFromName] = React.useState(data.emailFromName);
  const [brandColor, setBrandColor] = React.useState(data.emailBrandColor);
  const [buttonText, setButtonText] = React.useState(data.emailButtonText);
  const [html, setHtml] = React.useState(data.emailBodyHTML);
  const editorRef = React.useRef<HTMLDivElement | null>(null);

  // Cashback email state
  const [cashbackSubject, setCashbackSubject] = React.useState(data.cashbackEmailSubject);
  const [cashbackFromName, setCashbackFromName] = React.useState(data.cashbackEmailFromName);
  const [cashbackBrandColor, setCashbackBrandColor] = React.useState(data.cashbackEmailBrandColor);
  const [cashbackHtml, setCashbackHtml] = React.useState(data.cashbackEmailBodyHTML);
  const [cashbackProcessingTime, setCashbackProcessingTime] = React.useState(data.cashbackProcessingTime);
  const cashbackEditorRef = React.useRef<HTMLDivElement | null>(null);

  // Sæt initialt indhold én gang for at undgå caret-hop ved hver render
  React.useEffect(() => {
    if (editorRef.current && html) {
      editorRef.current.innerHTML = html;
    }
    if (cashbackEditorRef.current && cashbackHtml) {
      cashbackEditorRef.current.innerHTML = cashbackHtml;
    }
    if (reminderEditorRef.current && reminderHtml) {
      reminderEditorRef.current.innerHTML = reminderHtml;
    }
    // Kun ved første mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ marginBottom: 12 }}>Email Template</h1>
      <p style={{ color: "#6b7280", marginBottom: 16 }}>
        Redigér mailen og se en live forhåndsvisning.
      </p>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={() => setEmailType('voucher')}
          style={{
            padding: '8px 16px',
            background: emailType === 'voucher' ? '#a855f7' : '#e5e7eb',
            color: emailType === 'voucher' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          🎁 Voucher/Rabat Email
        </button>
        <button
          type="button"
          onClick={() => setEmailType('cashback')}
          style={{
            padding: '8px 16px',
            background: emailType === 'cashback' ? '#10b981' : '#e5e7eb',
            color: emailType === 'cashback' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          💰 Cashback Email
        </button>
        <button
          type="button"
          onClick={() => setEmailType('reminder')}
          style={{
            padding: '8px 16px',
            background: emailType === 'reminder' ? '#f59e42' : '#e5e7eb',
            color: emailType === 'reminder' ? '#fff' : '#374151',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          🔔 Reminder Email
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <fetcher.Form method="post">
            {emailType === 'voucher' && (
              <div style={{ display: "grid", gap: 16 }}>
                <label>
                  Emne
                  <input name="emailSubject" value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Afsendernavn
                  <input name="emailFromName" value={fromName} onChange={(e) => setFromName(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Brand farve
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      style={{ width: 40, height: 32, padding: 0, border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                    <input
                      name="emailBrandColor"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </label>
                <label>
                  Knap tekst
                  <input name="emailButtonText" value={buttonText} onChange={(e) => setButtonText(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Indhold (WYSIWYG)
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={(e) => setHtml((e.target as HTMLDivElement).innerHTML)}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      minHeight: 200,
                      padding: 12,
                      fontFamily: 'system-ui, sans-serif',
                      background: '#fff',
                      whiteSpace: 'pre-wrap'
                    }}
                  />
                  <textarea name="emailBodyHTML" value={html} readOnly hidden />
                </label>
              </div>
            )}
            {emailType === 'cashback' && (
              <div style={{ display: "grid", gap: 16 }}>
                <label>
                  Emne
                  <input name="cashbackEmailSubject" value={cashbackSubject} onChange={(e) => setCashbackSubject(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Afsendernavn
                  <input name="cashbackEmailFromName" value={cashbackFromName} onChange={(e) => setCashbackFromName(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Brand farve
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={cashbackBrandColor}
                      onChange={(e) => setCashbackBrandColor(e.target.value)}
                      style={{ width: 40, height: 32, padding: 0, border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                    <input
                      name="cashbackEmailBrandColor"
                      value={cashbackBrandColor}
                      onChange={(e) => setCashbackBrandColor(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </label>
                <label>
                  Indhold (WYSIWYG)
                  <div
                    ref={cashbackEditorRef}
                    contentEditable
                    onInput={(e) => setCashbackHtml((e.target as HTMLDivElement).innerHTML)}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      minHeight: 200,
                      padding: 12,
                      fontFamily: 'system-ui, sans-serif',
                      background: '#fff',
                      whiteSpace: 'pre-wrap'
                    }}
                  />
                  <textarea name="cashbackEmailBodyHTML" value={cashbackHtml} readOnly hidden />
                </label>
                <label>
                  Forventet behandlingstid
                  <input 
                    name="cashbackProcessingTime" 
                    value={cashbackProcessingTime} 
                    onChange={(e) => setCashbackProcessingTime(e.target.value)} 
                    style={{ width: "100%" }} 
                    placeholder="3-5 hverdage"
                  />
                </label>
              </div>
            )}
            {emailType === 'reminder' && (
              <div style={{ display: "grid", gap: 16 }}>
                <label>
                  Emne
                  <input name="reminderEmailSubject" value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Afsendernavn
                  <input name="reminderEmailFromName" value={reminderFromName} onChange={(e) => setReminderFromName(e.target.value)} style={{ width: "100%" }} />
                </label>
                <label>
                  Brand farve
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="color"
                      value={reminderBrandColor}
                      onChange={(e) => setReminderBrandColor(e.target.value)}
                      style={{ width: 40, height: 32, padding: 0, border: '1px solid #d1d5db', borderRadius: 6 }}
                    />
                    <input
                      name="reminderEmailBrandColor"
                      value={reminderBrandColor}
                      onChange={(e) => setReminderBrandColor(e.target.value)}
                      style={{ flex: 1 }}
                    />
                  </div>
                </label>
                <label>
                  Indhold (WYSIWYG)
                  <div
                    ref={reminderEditorRef}
                    contentEditable
                    onInput={(e) => setReminderHtml((e.target as HTMLDivElement).innerHTML)}
                    style={{
                      border: '1px solid #d1d5db',
                      borderRadius: 6,
                      minHeight: 200,
                      padding: 12,
                      fontFamily: 'system-ui, sans-serif',
                      background: '#fff',
                      whiteSpace: 'pre-wrap'
                    }}
                  />
                  <textarea name="reminderEmailBodyHTML" value={reminderHtml} readOnly hidden />
                </label>
              </div>
            )}

            {/* Hidden fields for the type we're not editing */}
            {/* Hidden fields for the types we're not editing */}
            {emailType !== 'voucher' && (
              <>
                <input type="hidden" name="emailSubject" value={subject} />
                <input type="hidden" name="emailFromName" value={fromName} />
                <input type="hidden" name="emailBodyHTML" value={html} />
                <input type="hidden" name="emailButtonText" value={buttonText} />
                <input type="hidden" name="emailBrandColor" value={brandColor} />
              </>
            )}
            {emailType !== 'cashback' && (
              <>
                <input type="hidden" name="cashbackEmailSubject" value={cashbackSubject} />
                <input type="hidden" name="cashbackEmailFromName" value={cashbackFromName} />
                <input type="hidden" name="cashbackEmailBodyHTML" value={cashbackHtml} />
                <input type="hidden" name="cashbackEmailBrandColor" value={cashbackBrandColor} />
                <input type="hidden" name="cashbackProcessingTime" value={cashbackProcessingTime} />
              </>
            )}
            {emailType !== 'reminder' && (
              <>
                <input type="hidden" name="reminderEmailSubject" value={reminderSubject} />
                <input type="hidden" name="reminderEmailFromName" value={reminderFromName} />
                <input type="hidden" name="reminderEmailBodyHTML" value={reminderHtml} />
                <input type="hidden" name="reminderEmailBrandColor" value={reminderBrandColor} />
              </>
            )}

            <button type="submit" style={{ marginTop: 16 }}>Gem</button>
          </fetcher.Form>

          {fetcher.data?.success && (
            <div style={{ marginTop: 12, color: "#065f46" }}>Gemte email-indstillinger</div>
          )}
        </div>

        <div>
          <h2 style={{ margin: 0, marginBottom: 8 }}>Forhåndsvisning</h2>
          {emailType === 'voucher' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: brandColor, padding: 24, textAlign: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0 }}>{subject}</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>Fra: {fromName}</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb' }}>
                <div dangerouslySetInnerHTML={{ __html: html }} />
                <div style={{ textAlign: 'center', marginTop: 16 }}>
                  <a href="#" style={{ display: 'inline-block', background: brandColor, color: '#fff', padding: '10px 16px', borderRadius: 6, textDecoration: 'none' }}>{buttonText}</a>
                </div>
                <div style={{
                  marginTop: 16,
                  background: '#ffffff',
                  border: `2px solid ${brandColor}`,
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Eksempel rabatkode</div>
                  <div style={{ fontFamily: 'Courier New, monospace', fontWeight: 'bold', fontSize: 22, color: brandColor, marginTop: 4 }}>SJ-EXAMPLE-2025</div>
                  <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Kopier og indsæt ved kassen</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, color: '#6b7280', fontSize: 12 }}>© {fromName}</div>
            </div>
          )}
          {emailType === 'cashback' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: cashbackBrandColor, padding: 24, textAlign: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0 }}>{cashbackSubject}</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>Fra: {cashbackFromName}</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb' }}>
                <div dangerouslySetInnerHTML={{ __html: cashbackHtml }} />
                <div style={{
                  marginTop: 16,
                  background: '#ffffff',
                  border: `2px solid ${cashbackBrandColor}`,
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 8 }}>Vi verificerer dit post, behandler derefter din cashback og sender pengene snarest.</div>
                  <div style={{ fontWeight: 'bold', fontSize: 18, color: cashbackBrandColor }}>Forventet behandlingstid: {cashbackProcessingTime}</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', padding: 12, color: '#6b7280', fontSize: 12 }}>© {cashbackFromName}</div>
            </div>
          )}
          {emailType === 'reminder' && (
            <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ background: reminderBrandColor, padding: 24, textAlign: 'center' }}>
                <h3 style={{ color: '#fff', margin: 0 }}>{reminderSubject}</h3>
                <p style={{ color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>Fra: {reminderFromName}</p>
              </div>
              <div style={{ padding: 16, background: '#f9fafb' }}>
                <div dangerouslySetInnerHTML={{ __html: reminderHtml }} />
              </div>
              <div style={{ textAlign: 'center', padding: 12, color: '#6b7280', fontSize: 12 }}>© {reminderFromName}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
