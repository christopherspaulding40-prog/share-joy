
import { useState } from 'react';
import { data } from 'react-router';
import prisma from '../db.server';

export const loader = async () => {
  try {
    const submissions = await (prisma as any).submission.findMany({
      include: {
        reward: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    let settings = await (prisma as any).rewardSettings.findFirst();
    if (!settings) {
      settings = await (prisma as any).rewardSettings.create({
        data: {
          rewardType: 'cashback',
          defaultAmount: 5000,
        },
      });
    }

    const stats = {
      total: await (prisma as any).submission.count(),
      pending: await (prisma as any).submission.count({ where: { status: 'pending' } }),
      approved: await (prisma as any).submission.count({ where: { status: 'approved' } }),
      rejected: await (prisma as any).submission.count({ where: { status: 'rejected' } }),
    };

    return data({ submissions, stats, settings });
  } catch (error) {
    console.error('Error loading submissions:', error);
    return data({ submissions: [], stats: { total: 0, pending: 0, approved: 0, rejected: 0 }, settings: {} });
  }
};

export const action = async ({ request }: any) => {
  if (request.method === 'POST') {
    try {
      const body = await request.json();
      const { type, submissionId, amount } = body;

      // Hent settings for reward-type
      let settings = await (prisma as any).rewardSettings.findFirst();
      if (!settings) {
        settings = await (prisma as any).rewardSettings.create({
          data: { rewardType: 'cashback', defaultAmount: 5000 },
        });
      }

      if (type === 'approve') {
        const finalAmount = amount || settings.defaultAmount;
        const updated = await (prisma as any).submission.update({
          where: { id: submissionId },
          data: {
            status: 'approved',
            reward: {
              create: {
                type: settings.rewardType,
                amount: finalAmount,
              },
            },
          },
          include: { reward: true },
        });
        return data({ success: true, submission: updated });
      }

      if (type === 'reject') {
        const updated = await (prisma as any).submission.update({
          where: { id: submissionId },
          data: { status: 'rejected' },
        });
        return data({ success: true, submission: updated });
      }

      return data({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
      console.error('Error:', error);
      return data({ error: 'Operation failed' }, { status: 500 });
    }
  }

  return data({ error: 'Method not allowed' }, { status: 405 });
};

export default function AdminSubmissions({ loaderData }: any) {
  const { submissions = [], stats = {}, settings = {} } = loaderData as any;
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const filtered = submissions.filter((s: any) =>
    filter === 'all' ? true : s.status === filter
  );

  const defaultAmountDKK = Math.round((settings?.defaultAmount || 5000) / 100);

  const handleApprove = async (id: string) => {
    if (!confirm(`Verificer og send ${settings.rewardType === 'voucher' ? 'voucher' : 'cashback refund'}?`)) return;

    try {
      const formData = new FormData();
      formData.append('submissionId', id);
      formData.append('action', 'approve');

      const response = await fetch('/api/submission/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        alert(result.message);
        window.location.reload();
      } else {
        alert(result.error || 'Fejl ved verificering');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Fejl ved verificering');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Er du sikker på at ville afvise dette?')) return;

    try {
      const formData = new FormData();
      formData.append('submissionId', id);
      formData.append('action', 'reject');

      const response = await fetch('/api/submission/verify', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.location.reload();
      } else {
        alert(result.error || 'Fejl ved afvisning');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Fejl ved afvisning');
    }
  };

  return (
    <div style={styles.container}>
      <style>{css}</style>

      <div style={styles.header}>
        <h1>Reward Submissions</h1>
        <p>Administrer kunde uploads og billedgodkendelser</p>
      </div>

      {/* Gallery */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 8px 0' }}>Seneste uploads</h2>
        <p style={{ margin: '0 0 12px 0', color: '#666' }}>Se et hurtigt overblik over de seneste uploadede billeder.</p>
        <div style={styles.galleryGrid}>
          {(submissions || []).slice(0, 12).map((s: any) => (
            <div key={s.id} style={styles.galleryItem} onClick={() => setSelectedImage(s.imageUrl)}>
              <img src={s.imageUrl} alt={`upload-${s.id}`} style={styles.galleryImage} />
              <div style={styles.galleryMeta}>{new Date(s.createdAt).toLocaleDateString('da-DK')}</div>
            </div>
          ))}
          {(!submissions || submissions.length === 0) && (
            <div style={{ color: '#666' }}>Ingen uploads endnu.</div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total || 0}</div>
          <div style={styles.statLabel}>I alt</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNumber, color: '#ff9500' }}>{stats.pending || 0}</div>
          <div style={styles.statLabel}>Afventer</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNumber, color: '#34c759' }}>{stats.approved || 0}</div>
          <div style={styles.statLabel}>Godkendt</div>
        </div>
        <div style={styles.statCard}>
          <div style={{ ...styles.statNumber, color: '#ff3b30' }}>{stats.rejected || 0}</div>
          <div style={styles.statLabel}>Afvist</div>
        </div>
      </div>

      {/* Filters */}
      <div style={styles.filterContainer}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              ...styles.filterBtn,
              backgroundColor: filter === f ? '#000' : '#f0f0f0',
              color: filter === f ? '#fff' : '#000',
            }}
          >
            {f === 'all' ? 'Alle' : f === 'pending' ? 'Afventer' : f === 'approved' ? 'Godkendt' : 'Afvist'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Dato</th>
              <th>Kunde</th>
              <th>Email</th>
              <th>Ordrenr.</th>
              <th>Produkt</th>
              <th>Billede</th>
              <th>Status</th>
              <th>Handling</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((submission: any) => (
              <tr key={submission.id}>
                <td>{new Date(submission.createdAt).toLocaleDateString('da-DK')}</td>
                <td>{submission.customerName}</td>
                <td>{submission.customerEmail}</td>
                <td>{submission.orderNumber || '-'}</td>
                <td>{submission.productTitle}</td>
                <td>
                  <img
                    src={submission.imageData || submission.imageUrl}
                    alt="preview"
                    style={styles.thumbnail}
                    onClick={() => setSelectedImage(submission.imageData || submission.imageUrl)}
                  />
                </td>
                <td>
                  <span
                    style={{
                      ...styles.statusBadge,
                      backgroundColor:
                        submission.status === 'pending'
                          ? '#fff3cd'
                          : submission.status === 'approved'
                            ? '#d4edda'
                            : '#f8d7da',
                      color:
                        submission.status === 'pending'
                          ? '#856404'
                          : submission.status === 'approved'
                            ? '#155724'
                            : '#721c24',
                    }}
                  >
                    {submission.status === 'pending'
                      ? 'Afventer'
                      : submission.status === 'approved'
                        ? 'Godkendt'
                        : 'Afvist'}
                  </span>
                </td>
                <td>
                  {submission.status === 'pending' && (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleApprove(submission.id)}
                        style={{ ...styles.btn, ...styles.btnSuccess }}
                        title="Verificer & Refunder"
                      >
                        Verificer & Refunder
                      </button>
                      <button
                        onClick={() => handleReject(submission.id)}
                        style={{ ...styles.btn, ...styles.btnDanger }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          style={styles.modal}
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt="full"
            style={styles.modalImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

const styles: any = {
  container: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  header: {
    marginBottom: '32px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '32px',
  },
  statCard: {
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    textAlign: 'center',
  },
  statNumber: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#000',
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    marginTop: '8px',
  },
  filterContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
  },
  galleryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
    gap: '12px',
    alignItems: 'start',
    marginBottom: '12px',
  },
  galleryItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 6,
    border: '1px solid #eaeaea',
    cursor: 'pointer',
    textAlign: 'center',
  },
  galleryImage: {
    width: '100%',
    height: 100,
    objectFit: 'cover',
    borderRadius: 6,
    display: 'block',
    marginBottom: 6,
  },
  galleryMeta: {
    fontSize: 12,
    color: '#666',
  },
  filterBtn: {
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e0e0e0',
    overflow: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thumbnail: {
    width: '40px',
    height: '40px',
    objectFit: 'cover',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500',
  },
  actionButtons: {
    display: 'flex',
    gap: '4px',
  },
  btn: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  btnSuccess: {
    backgroundColor: '#34c759',
    color: '#fff',
  },
  btnDanger: {
    backgroundColor: '#ff3b30',
    color: '#fff',
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalImage: {
    maxWidth: '90vw',
    maxHeight: '90vh',
    objectFit: 'contain',
  },
};

const css = `
  table th {
    background-color: #f5f5f5;
    padding: 12px;
    text-align: left;
    border-bottom: 2px solid #e0e0e0;
    font-weight: 600;
    font-size: 14px;
  }
  
  table td {
    padding: 12px;
    border-bottom: 1px solid #e0e0e0;
  }
  
  table tbody tr:hover {
    background-color: #fafafa;
  }
`;

// Auto-upload from widget localStorage
if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  if (params.get('upload') === 'widget') {
    setTimeout(() => {
      const pending = localStorage.getItem('sharejoy_pending');
      if (pending) {
        const data = JSON.parse(pending);
        
        // Convert base64 to file
        fetch(data.imageData)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'screenshot.png', { type: 'image/png' });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('productId', data.productId);
            formData.append('productTitle', data.productTitle);
            formData.append('customerEmail', data.email);
            formData.append('customerName', 'Widget - Order ' + data.orderNumber);
            
            return fetch('/api/rewards/upload', {
              method: 'POST',
              body: formData
            });
          })
          .then(r => r.json())
          .then(() => {
            localStorage.removeItem('sharejoy_pending');
            alert('✅ Submission oprettet!');
            window.location.href = '/app/admin/submissions';
          })
          .catch(err => {
            console.error('Upload error:', err);
            alert('❌ Fejl ved upload: ' + err.message);
          });
      }
    }, 500);
  }
}
