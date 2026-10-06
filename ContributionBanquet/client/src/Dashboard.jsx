import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getContributions } from "./api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [viewOpen, setViewOpen] = useState(false);
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));
  const printableItems = selectedItems.length > 0 ? selectedItems : items.slice(0, 1);
  const selectedTotal = selectedItems.reduce(
    (total, item) => total + Number(item.gift_amount || 0),
    0
  );
  const totalAmount = items.reduce(
    (total, item) => total + Number(item.gift_amount || 0),
    0
  );

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getContributions();
        const loadedItems = (response.contributions || []).map((item) => ({
          ...item,
          billImage: localStorage.getItem(`bill-image-${item.id}`) || "",
        }));
        setItems(loadedItems);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const toggleSelected = (id) => {
    setSelectedIds((currentIds) =>
      currentIds.includes(id)
        ? currentIds.filter((currentId) => currentId !== id)
        : [...currentIds, id]
    );
  };

  const toggleSelectAll = () => {
    setSelectedIds((currentIds) =>
      currentIds.length === items.length ? [] : items.map((item) => item.id)
    );
  };

  return (
    <div className="dashboard-page" style={{ padding: "24px 20px", background: "#f8f4ec", minHeight: "100vh" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto" }}>
        {viewOpen && (
          <div className="dashboard-view-modal" onClick={() => setViewOpen(false)}>
            <div className="dashboard-view-panel" onClick={(event) => event.stopPropagation()}>
              <div className="dashboard-view-header">
                <h3>Contribution Details</h3>
                <button type="button" onClick={() => setViewOpen(false)}>Close</button>
              </div>

              <div className="dashboard-view-grid">
                {items.length === 0 ? (
                  <p>No records available.</p>
                ) : (
                  items.map((item, index) => {
                    const previousItem = index > 0 ? items[index - 1] : null;

                    return (
                      <div key={item.id ?? `view-${index}`} className="dashboard-view-item">
                        <div className="dashboard-view-section">
                          <h4>Current</h4>
                          <p><strong>Bill No:</strong> {item.id}</p>
                          <p><strong>Name:</strong> {item.name}</p>
                          <p><strong>Native Place:</strong> {item.city}</p>
                          <p><strong>Amount:</strong> ₹ {Number(item.gift_amount || 0).toLocaleString("en-IN")}</p>
                        </div>

                        <div className="dashboard-view-section">
                          <h4>Previous</h4>
                          {previousItem ? (
                            <>
                              <p><strong>Bill No:</strong> {previousItem.id}</p>
                              <p><strong>Name:</strong> {previousItem.name}</p>
                              <p><strong>Native Place:</strong> {previousItem.city}</p>
                              <p><strong>Amount:</strong> ₹ {Number(previousItem.gift_amount || 0).toLocaleString("en-IN")}</p>
                            </>
                          ) : (
                            <p>No previous record.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-controls"
          style={{
            background: "#650d2b",
            color: "white",
            padding: "18px 24px",
            borderRadius: "12px 12px 0 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 800 }}>SPEED MOI</div>
          <div className="dashboard-header-actions" style={{ display: "flex", gap: "12px" }}>
            <button
              type="button"
              className="print-selected-button header-print-button"
              onClick={() => window.print()}
              disabled={selectedItems.length === 0}
            >
              Print selected ({selectedItems.length})
            </button>
            <button
              type="button"
              onClick={() => setViewOpen(true)}
              style={{
                padding: "10px 18px",
                borderRadius: "20px",
                border: "1px solid #d6a83d",
                background: "transparent",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View
            </button>
            <button
              type="button"
              onClick={() => navigate("/voice")}
              style={{
                padding: "10px 18px",
                borderRadius: "20px",
                border: "1px solid #d6a83d",
                background: "transparent",
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Add New
            </button>
          </div>
        </div>

        <div
          style={{
            background: "white",
            border: "1px solid #eadfc9",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            padding: "24px",
            boxShadow: "0 10px 30px rgba(92, 52, 33, 0.10)",
          }}
        >
          <h2 style={{ margin: "0 0 18px", color: "#650d2b" }}>Dashboard</h2>

          <div className="dashboard-print-controls">
            <label className="select-all-control">
              <input
                type="checkbox"
                checked={items.length > 0 && selectedIds.length === items.length}
                onChange={toggleSelectAll}
                disabled={loading || items.length === 0}
              />
              Select all
            </label>
          </div>

          <div className="overall-total"
            style={{
              marginBottom: "20px",
              padding: "16px 18px",
              borderLeft: "4px solid #d6a83d",
              background: "#fff8e8",
            }}
          >
            <div style={{ color: "#5a444d", fontWeight: 700 }}>Overall Total Amount</div>
            <strong style={{ display: "block", marginTop: "4px", color: "#650d2b", fontSize: "28px" }}>
              {loading ? "Calculating..." : `₹ ${totalAmount.toLocaleString("en-IN")}`}
            </strong>
          </div>

          {loading ? (
            <p>Loading contributions...</p>
          ) : items.length === 0 ? (
            <p>No contributions saved yet.</p>
          ) : (
            <div className="dashboard-print-area" style={{ display: "grid", gap: "14px" }}>
              <div className="print-heading">
                <h1>SPEED MOI</h1>
                <h2>Selected Contributions</h2>
                <p>Total: ₹ {selectedTotal.toLocaleString("en-IN")}</p>
              </div>

              {printableItems.map((item, index) => {
                const receiptDate = new Date().toLocaleDateString("en-GB");
                const receiptTime = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });

                return (
                  <div
                    key={item.id ?? `item-${index}`}
                    className={`dashboard-entry speedmoi-bill ${selectedIds.includes(item.id) ? "is-selected" : ""}`}
                    style={{
                      border: "1px solid #ecd9b7",
                      borderRadius: "10px",
                      padding: "16px",
                      background: "#fffdf9",
                    }}
                  >
                    <div className="dashboard-entry-heading" style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap" }}>
                      <label className="entry-select-control">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          aria-label={`Select ${item.name} contribution for printing`}
                        />
                      </label>
                      <strong style={{ fontSize: "18px", color: "#3d2530" }}>{item.name}</strong>
                      <span style={{ color: "#650d2b", fontWeight: 700 }}>₹ {Number(item.gift_amount || 0).toLocaleString("en-IN")}</span>
                    </div>

                    <div className="speedmoi-receipt">
                      <div className="receipt-header">
                        <div className="receipt-topline">Contributor&apos;s / பங்களிப்பாளர்</div>
                        <div className="receipt-stars">✦ ✦ ✦</div>
                        <div className="receipt-brand">SPEED MOI</div>
                        <div className="receipt-subtitle">CONTRIBUTION RECEIPT • பங்களிப்பு ரசீது</div>
                      </div>

                      <div className="receipt-function-box">
                        <div className="receipt-function-title">Wedding Function</div>
                        <div className="receipt-function-detail">{item.name || "Contributor"}</div>
                        <div className="receipt-function-detail">{item.city || "Native Place"}</div>
                      </div>

                      <div className="receipt-meta">
                        <div><span>Bill No</span> <strong>: {item.id}</strong></div>
                        <div><span>Date</span> <strong>: {receiptDate}</strong></div>
                        <div><span>Time</span> <strong>: {receiptTime}</strong></div>
                      </div>

                      <div className="receipt-body">
                        <div className="receipt-row">
                          <span>Name</span>
                          <strong>{item.name || "-"}</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Native Place</span>
                          <strong>{item.city || "-"}</strong>
                        </div>
                        <div className="receipt-row">
                          <span>Contribution</span>
                          <strong>₹ {Number(item.gift_amount || 0).toLocaleString("en-IN")}</strong>
                        </div>
                      </div>

                      {item.billImage && (
                        <div className="receipt-image-wrap">
                          <img src={item.billImage} alt={`${item.name} bill`} />
                        </div>
                      )}

                      <div className="receipt-footer">
                        <div className="receipt-total-line">
                          <span>Contribution Amount</span>
                          <strong>₹ {Number(item.gift_amount || 0).toLocaleString("en-IN")}</strong>
                        </div>
                        <p>Thank you / நன்றி</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
