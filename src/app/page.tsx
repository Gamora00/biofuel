"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { BinStatusBanner } from "@/components/BinStatusBanner";
import { SmartBinInfoCard } from "@/components/SmartBinInfoCard";
import { WeightCard } from "@/components/WeightCard";
import { FillLevelCard } from "@/components/FillLevelCard";
import { SecurityCard } from "@/components/SecurityCard";
import { TempCard } from "@/components/TempCard";
import { CollectionTrendChart } from "@/components/CollectionTrendChart";
import { RecentDepositsCard } from "@/components/RecentDepositsCard";
import { FeedstockAssessmentCard } from "@/components/FeedstockAssessmentCard";
import { PickupRequestModal } from "@/components/Modals/PickupRequestModal";
import { TechnicalReviewModal } from "@/components/Modals/TechnicalReviewModal";
import { SmartBinsOverviewModal } from "@/components/Modals/SmartBinsOverviewModal";
import { NewDepositModal } from "@/components/Modals/NewDepositModal";
import { ESP32LiveBridge } from "@/components/ESP32LiveBridge";

import {
  INITIAL_BINS,
  INITIAL_DEPOSITS,
  INITIAL_ASSESSMENTS,
  INITIAL_TRENDS,
} from "@/lib/mockData";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import {
  SmartBin,
  Deposit,
  FeedstockAssessment,
  TrendPoint,
} from "@/types/database";

export default function DashboardPage() {
  const [bins, setBins] = useState<SmartBin[]>(INITIAL_BINS);
  const [selectedBinId, setSelectedBinId] = useState<string>("BIN-001");
  const [depositsByBin, setDepositsByBin] =
    useState<Record<string, Deposit[]>>(INITIAL_DEPOSITS);
  const [assessmentsByBin, setAssessmentsByBin] =
    useState<Record<string, FeedstockAssessment>>(INITIAL_ASSESSMENTS);
  const [trendsByBin, setTrendsByBin] =
    useState<Record<string, TrendPoint[]>>(INITIAL_TRENDS);

  const [activeTab, setActiveTab] = useState<"deposit_log" | "pickup_request">(
    "deposit_log"
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [esp32Distance, setEsp32Distance] = useState<number | undefined>(undefined);

  // Modal states
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [overviewModalOpen, setOverviewModalOpen] = useState(false);
  const [newDepositModalOpen, setNewDepositModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const selectedBin =
    bins.find((b) => b.id === selectedBinId) || bins[0];
  const currentDeposits = depositsByBin[selectedBin.id] || [];
  const currentAssessment =
    assessmentsByBin[selectedBin.id] || INITIAL_ASSESSMENTS["BIN-001"];
  const currentTrend =
    trendsByBin[selectedBin.id] || INITIAL_TRENDS["BIN-001"];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Optional live fetch from Supabase if configured
  useEffect(() => {
    const client = supabase;
    if (!isSupabaseConfigured || !client) return;

    const loadSupabaseData = async () => {
      try {
        const { data: binsData } = await client
          .from("bins")
          .select("*")
          .order("id");
        if (binsData && binsData.length > 0) {
          setBins(
            binsData.map((b: any) => ({
              id: b.id,
              name: b.name,
              location: b.location,
              status: b.status,
              capacity_kg: Number(b.capacity_kg),
              current_weight_kg: Number(b.current_weight_kg),
              fill_level_pct: Math.round(
                (Number(b.current_weight_kg) / Number(b.capacity_kg)) * 100
              ),
              temp_c: Number(b.temp_c),
              battery_pct: Number(b.battery_pct),
              device_id: b.device_id,
              lid_status: b.lid_status,
              last_comm_at: "Just now",
            }))
          );
        }
      } catch (err) {
        console.error("Supabase fetch fallback to local state:", err);
      }
    };

    loadSupabaseData();
  }, []);

  // Refresh simulation
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setBins((prev) =>
        prev.map((b) =>
          b.id === selectedBin.id
            ? {
                ...b,
                last_comm_at: "Just now",
                temp_c: Number(
                  (b.temp_c + (Math.random() * 0.2 - 0.1)).toFixed(1)
                ),
              }
            : b
        )
      );
      setIsRefreshing(false);
      showToast(`Telemetry synced with ${selectedBin.device_id}`);
    }, 600);
  };

  // Handle incoming live data from ESP32
  const handleESP32Data = (data: {
    bin_id: string;
    distance_cm: number;
    level_percent: number;
  }) => {
    setEsp32Distance(data.distance_cm);

    // Calculate updated weight based on capacity and fill percentage
    const updatedWeight = Number(
      ((data.level_percent / 100) * selectedBin.capacity_kg).toFixed(2)
    );

    setBins((prev) =>
      prev.map((b) =>
        b.id === selectedBin.id
          ? {
              ...b,
              current_weight_kg: updatedWeight,
              fill_level_pct: Math.round(data.level_percent),
              last_comm_at: "Just now",
              status: "Online",
            }
          : b
      )
    );

    // If Supabase is connected, update bin telemetry in database
    if (isSupabaseConfigured && supabase) {
      supabase
        .from("bins")
        .update({
          current_weight_kg: updatedWeight,
          last_comm_at: new Date().toISOString(),
        })
        .eq("id", selectedBin.id);
    }
  };

  // Handle adding a new UCO deposit
  const handleAddDeposit = async (sourceName: string, weightKg: number) => {
    const codeNumber = Math.floor(135 + Math.random() * 60);
    const depositCode = `DEP-0${codeNumber}`;
    const nowTime = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });

    const newDeposit: Deposit = {
      id: `dep-${Date.now()}`,
      bin_id: selectedBin.id,
      source_name: sourceName,
      deposit_code: depositCode,
      weight_kg: weightKg,
      status: "Verified",
      deposited_at: new Date().toISOString(),
      formatted_time: nowTime,
    };

    // Update deposits
    setDepositsByBin((prev) => ({
      ...prev,
      [selectedBin.id]: [newDeposit, ...(prev[selectedBin.id] || [])],
    }));

    // Update bin weight & fill percentage
    const updatedWeight = Math.min(
      selectedBin.capacity_kg,
      Number((selectedBin.current_weight_kg + weightKg).toFixed(2))
    );
    const updatedFillPct = Math.round(
      (updatedWeight / selectedBin.capacity_kg) * 100
    );

    setBins((prev) =>
      prev.map((b) =>
        b.id === selectedBin.id
          ? {
              ...b,
              current_weight_kg: updatedWeight,
              fill_level_pct: updatedFillPct,
              last_comm_at: "Just now",
            }
          : b
      )
    );

    // Append to trend chart
    setTrendsByBin((prev) => ({
      ...prev,
      [selectedBin.id]: [
        ...(prev[selectedBin.id] || []),
        { label: nowTime, time: nowTime, weight: updatedWeight },
      ],
    }));

    // Persist to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      await supabase.from("deposits").insert({
        id: newDeposit.id,
        bin_id: newDeposit.bin_id,
        source_name: newDeposit.source_name,
        deposit_code: newDeposit.deposit_code,
        weight_kg: newDeposit.weight_kg,
        status: "Verified",
      });
      await supabase
        .from("bins")
        .update({ current_weight_kg: updatedWeight })
        .eq("id", selectedBin.id);
    }

    showToast(`Recorded +${weightKg.toFixed(1)} kg deposit from ${sourceName}`);
  };

  // Handle Pickup Request
  const handlePickupSubmit = async (
    priority: "Low" | "Standard" | "Urgent",
    notes: string,
    schedule: string
  ) => {
    if (isSupabaseConfigured && supabase) {
      await supabase.from("pickup_requests").insert({
        bin_id: selectedBin.id,
        requested_by: "Maria Reyes",
        current_fill_kg: selectedBin.current_weight_kg,
        priority,
        notes: `${schedule} - ${notes}`,
      });
    }
    showToast(`Pickup request scheduled (${priority}) for ${selectedBin.name}`);
  };

  // Handle Technical Review Request
  const handleConfirmReview = async (notes: string, treatmentType: string) => {
    setAssessmentsByBin((prev) => ({
      ...prev,
      [selectedBin.id]: {
        ...currentAssessment,
        review_requested: true,
      },
    }));

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("feedstock_assessments")
        .update({
          review_requested: true,
          review_notes: `${treatmentType}: ${notes}`,
        })
        .eq("bin_id", selectedBin.id);
    }

    showToast(`Technical review assigned for ${selectedBin.name}`);
  };

  const remainingKg = Math.max(
    0,
    Number((selectedBin.capacity_kg - selectedBin.current_weight_kg).toFixed(2))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f6f5]">
      {/* Top Navigation Bar */}
      <Header
        onOpenOverview={() => setOverviewModalOpen(true)}
        binsCount={bins.length}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 pb-10">
        {/* Subheader Status Banner */}
        <BinStatusBanner
          selectedBin={selectedBin}
          allBins={bins}
          onSelectBin={(id) => setSelectedBinId(id)}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          esp32Slot={
            <ESP32LiveBridge
              onDataReceived={handleESP32Data}
              currentFillLevel={selectedBin.fill_level_pct}
            />
          }
        />

        {/* ROW 1: 5 Telemetry Cards (4 + 3 + 2 + 2 + 1 = 12 cols) */}
        <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 mt-2">
          {/* Card 1: SmartBin Info & Actions */}
          <div className="md:col-span-6 lg:col-span-4">
            <SmartBinInfoCard
              bin={selectedBin}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onOpenPickupModal={() => setPickupModalOpen(true)}
            />
          </div>

          {/* Card 2: Current UCO Weight */}
          <div className="md:col-span-3 lg:col-span-3">
            <WeightCard
              currentWeight={selectedBin.current_weight_kg}
              capacity={selectedBin.capacity_kg}
              todayAdded={3.6}
            />
          </div>

          {/* Card 3: Fill Level */}
          <div className="md:col-span-3 lg:col-span-2">
            <FillLevelCard
              fillPct={selectedBin.fill_level_pct}
              remainingKg={remainingKg}
              distanceCm={esp32Distance}
            />
          </div>

          {/* Card 4: Lid & Leak Security Status */}
          <div className="md:col-span-3 lg:col-span-2">
            <SecurityCard
              status={selectedBin.lid_status}
              subtitle="Lid closed • No leaks"
            />
          </div>

          {/* Card 5: Temperature */}
          <div className="md:col-span-3 lg:col-span-1">
            <TempCard temp={selectedBin.temp_c} status="Normal" />
          </div>
        </div>

        {/* ROW 2: Trend Chart, Recent Deposits, Feedstock Assessment (5 + 4 + 3 = 12 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
          {/* Card 6: UCO Collection Trend */}
          <div className="lg:col-span-5">
            <CollectionTrendChart data={currentTrend} />
          </div>

          {/* Card 7: Recent Deposits */}
          <div className="lg:col-span-4">
            <RecentDepositsCard
              deposits={currentDeposits}
              onOpenNewDepositModal={() => setNewDepositModalOpen(true)}
            />
          </div>

          {/* Card 8: Feedstock Assessment */}
          <div className="lg:col-span-3">
            <FeedstockAssessmentCard
              assessment={currentAssessment}
              onRequestReview={() => setReviewModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Subtle Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#143823] text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg border border-emerald-500/30 flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <PickupRequestModal
        isOpen={pickupModalOpen}
        onClose={() => {
          setPickupModalOpen(false);
          setActiveTab("deposit_log");
        }}
        bin={selectedBin}
        onSubmit={handlePickupSubmit}
      />

      <TechnicalReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        bin={selectedBin}
        assessment={currentAssessment}
        onConfirmReview={handleConfirmReview}
      />

      <SmartBinsOverviewModal
        isOpen={overviewModalOpen}
        onClose={() => setOverviewModalOpen(false)}
        bins={bins}
        selectedBinId={selectedBin.id}
        onSelectBin={(id) => setSelectedBinId(id)}
      />

      <NewDepositModal
        isOpen={newDepositModalOpen}
        onClose={() => setNewDepositModalOpen(false)}
        binName={selectedBin.name}
        onAddDeposit={handleAddDeposit}
      />
    </div>
  );
}
