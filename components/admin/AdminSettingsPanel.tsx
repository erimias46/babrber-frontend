"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export function AdminSettingsPanel() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: () => api.getSettings().then((r) => r.data.data),
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (data) {
      // Ensure depositBounds is properly initialized
      const formData = {
        ...data,
        depositBounds: data.depositBounds || {
          minPercent: 5,
          maxPercent: 50,
          minFixed: 500,
          maxFixed: 10000,
        },
      };
      setForm(formData);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: (body: any) => {
      console.log("Sending settings update:", JSON.stringify(body, null, 2));
      return api.updateSettings(body);
    },
    onSuccess: (response) => {
      console.log("Settings update successful:", response);
      toast.success("Settings updated");
      qc.invalidateQueries({ queryKey: ["admin-settings"] });
    },
    onError: (error: any) => {
      console.error("Settings update error:", error);
      toast.error(error.response?.data?.message || "Failed to update settings");
    },
  });

  if (!form) return null;

  return (
    <Card className="mb-12">
      <h2 className="text-xl font-semibold mb-6">Platform Settings</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Deposits</h3>
          <label className="block text-sm font-medium mb-1">
            Enable Deposits
          </label>
          <select
            className="input mb-3"
            value={form.depositsEnabled ? "true" : "false"}
            onChange={(e) =>
              setForm({ ...form, depositsEnabled: e.target.value === "true" })
            }
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Type
              </label>
              <select
                className="input"
                value={form.defaultDepositType}
                onChange={(e) =>
                  setForm({ ...form, defaultDepositType: e.target.value })
                }
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Default Value
              </label>
              <input
                className="input"
                type="number"
                value={form.defaultDepositValue}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultDepositValue: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          <label className="block text-sm font-medium mb-1">
            Allow Barber Override
          </label>
          <select
            className="input mb-3"
            value={form.allowBarberOverride ? "true" : "false"}
            onChange={(e) =>
              setForm({
                ...form,
                allowBarberOverride: e.target.value === "true",
              })
            }
          >
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Min %</label>
              <input
                className="input"
                type="number"
                value={form.depositBounds?.minPercent ?? 5}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositBounds: {
                      ...form.depositBounds,
                      minPercent: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max %</label>
              <input
                className="input"
                type="number"
                value={form.depositBounds?.maxPercent ?? 50}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositBounds: {
                      ...form.depositBounds,
                      maxPercent: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Fixed (cents)
              </label>
              <input
                className="input"
                type="number"
                value={form.depositBounds?.minFixed ?? 500}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositBounds: {
                      ...form.depositBounds,
                      minFixed: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Max Fixed (cents)
              </label>
              <input
                className="input"
                type="number"
                value={form.depositBounds?.maxFixed ?? 10000}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositBounds: {
                      ...form.depositBounds,
                      maxFixed: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Refund Window (hrs)
              </label>
              <input
                className="input"
                type="number"
                value={form.depositRefundWindowHours}
                onChange={(e) =>
                  setForm({
                    ...form,
                    depositRefundWindowHours: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Allow Remainder Offline
              </label>
              <select
                className="input"
                value={form.remainderAllowOffline ? "true" : "false"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    remainderAllowOffline: e.target.value === "true",
                  })
                }
              >
                <option value="false">Online only</option>
                <option value="true">Allow offline</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Commission</h3>
          <label className="block text-sm font-medium mb-1">Commission %</label>
          <input
            className="input mb-3"
            type="number"
            value={form.commissionPercent}
            onChange={(e) =>
              setForm({ ...form, commissionPercent: Number(e.target.value) })
            }
          />

          <label className="block text-sm font-medium mb-1">Fees Payer</label>
          <select
            className="input mb-3"
            value={form.feesPayer}
            onChange={(e) => setForm({ ...form, feesPayer: e.target.value })}
          >
            <option value="platform">Platform</option>
            <option value="split">Split</option>
            <option value="barber">Barber</option>
          </select>

          <label className="block text-sm font-medium mb-1">Currency</label>
          <input
            className="input"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="block text-sm font-medium mb-1">
                Auto-release on completion
              </label>
              <select
                className="input"
                value={form.autoReleaseOnCompletion ? "true" : "false"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    autoReleaseOnCompletion: e.target.value === "true",
                  })
                }
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Manual refund review
              </label>
              <select
                className="input"
                value={form.manualRefundReview ? "true" : "false"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    manualRefundReview: e.target.value === "true",
                  })
                }
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <Button
          onClick={() => mutation.mutate(form)}
          loading={mutation.isPending}
        >
          Save Settings
        </Button>
      </div>
    </Card>
  );
}
