import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData } from "react-router";
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const orderNumber = url.searchParams.get("order") || "";
  const shop = url.searchParams.get("shop") || "";

  return { orderNumber, shop };
}

export default function Upload() {
  const { orderNumber, shop } = useLoaderData<typeof loader>();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const file = formData.get("image") as File;

    if (!file) {
      setMessage("Vælg venligst et billede");
      setUploading(false);
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const imageData = reader.result as string;

      try {
        const uploadData = new FormData();
        uploadData.append("shop", shop);
        uploadData.append("orderNumber", orderNumber);
        uploadData.append("customerEmail", formData.get("email") as string);
        uploadData.append("customerName", formData.get("name") as string);
        uploadData.append("imageUrl", imageData);
        uploadData.append("imageData", imageData);

        const response = await fetch("/api/submission/upload", {
          method: "POST",
          body: uploadData,
        });

        if (response.ok) {
          setMessage("✅ Upload gennemført! Vi sender dig besked når det er godkendt.");
          (e.target as HTMLFormElement).reset();
        } else {
          setMessage("❌ Upload fejlede. Prøv igen.");
        }
      } catch (error) {
        setMessage("❌ Noget gik galt. Prøv igen.");
      } finally {
        setUploading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div style={styles.container}>
      <style>{css}</style>
      <div style={styles.card}>
        <h1 style={styles.title}>🎁 Del & Få Rabat</h1>
        <p style={styles.subtitle}>Upload dit screenshot fra sociale medier</p>

        <Form method="post" onSubmit={handleSubmit} style={styles.form}>
          <input type="hidden" name="shop" value={shop} />
          <input type="hidden" name="orderNumber" value={orderNumber} />

          <div style={styles.field}>
            <label style={styles.label}>Ordrenummer</label>
            <input
              type="text"
              value={orderNumber}
              disabled
              style={{ ...styles.input, ...styles.inputDisabled }}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Dit navn</label>
            <input
              type="text"
              name="name"
              required
              style={styles.input}
              placeholder="Indtast dit navn"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Din email</label>
            <input
              type="email"
              name="email"
              required
              style={styles.input}
              placeholder="din@email.dk"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Screenshot</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              required
              style={styles.fileInput}
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            style={{
              ...styles.button,
              ...(uploading ? styles.buttonDisabled : {}),
            }}
          >
            {uploading ? "Uploader..." : "Upload & modtag belønning"}
          </button>

          {message && (
            <div
              style={{
                ...styles.message,
                ...(message.includes("✅") ? styles.messageSuccess : styles.messageError),
              }}
            >
              {message}
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  card: {
    background: "white",
    borderRadius: "16px",
    padding: "40px",
    maxWidth: "500px",
    width: "100%",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  title: {
    fontSize: "32px",
    fontWeight: "700",
    margin: "0 0 8px 0",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  subtitle: {
    fontSize: "16px",
    color: "#666",
    margin: "0 0 32px 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#333",
  },
  input: {
    padding: "12px",
    border: "2px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "16px",
    transition: "border-color 0.2s",
  },
  inputDisabled: {
    background: "#f5f5f5",
    color: "#999",
  },
  fileInput: {
    padding: "12px",
    border: "2px dashed #667eea",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer",
  },
  button: {
    padding: "16px",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "18px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  buttonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
  message: {
    padding: "12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "500",
  },
  messageSuccess: {
    background: "#d4edda",
    color: "#155724",
  },
  messageError: {
    background: "#f8d7da",
    color: "#721c24",
  },
};

const css = `
  input:focus,
  button:hover:not(:disabled) {
    outline: none;
    border-color: #667eea;
  }

  button:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
  }
`;
