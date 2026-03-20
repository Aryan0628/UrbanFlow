import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  AlertTriangle,
  ShieldAlert,
  TrendingUp,
  FileText,
  ChevronDown,
} from "lucide-react";
import { api } from "../../lib/api.js";

// ─── Sentiment Color Mapping ────────────────────────────────────────────
const SENTIMENT_COLORS = {
  POSITIVE: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
  NEUTRAL: { bg: "bg-slate-50", text: "text-slate-600", bar: "bg-slate-400" },
  NEGATIVE: { bg: "bg-orange-50", text: "text-orange-700", bar: "bg-orange-500" },
  ALARMING: { bg: "bg-red-50", text: "text-red-700", bar: "bg-red-500" },
};

const URGENCY_COLORS = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

// ─── Components ─────────────────────────────────────────────────────────

function SentimentBar({ label, count, total, colors }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-bold w-24 ${colors.text}`}>{label}</span>
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colors.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-mono text-slate-500 w-12 text-right">
        {count} ({pct}%)
      </span>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, subtitle, theme = "slate" }) {
  const themes = {
    slate: "bg-white border-slate-200",
    emerald: "bg-emerald-50 border-emerald-200",
    red: "bg-red-50 border-red-200",
    blue: "bg-blue-50 border-blue-200",
  };
  return (
    <div className={`p-6 rounded-2xl border ${themes[theme]} shadow-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-white rounded-xl border border-slate-100 flex items-center justify-center shadow-sm">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );
}

// ─── Shared Helpers ─────────────────────────────────────────────────────
const getTimeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

// ─── Cluster Detail Subcomponent ────────────────────────────────────────

function ClusterDetailView({ clusterId, onSummaryGenerated }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summarizing, setSummarizing] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [clusterId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/civic-analytics/cluster/${clusterId}`);
      if (res.data?.success) setDetails(res.data.data);
    } catch (err) {
      console.error("Failed to fetch cluster details", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    try {
      const res = await api.post(`/api/civic-analytics/cluster/${clusterId}/summarize`);
      if (res.data?.success) {
        setDetails(prev => ({ ...prev, aiSummary: res.data.data }));
        if (onSummaryGenerated) onSummaryGenerated(res.data.data);
      }
    } catch (err) {
      console.error("Summarization failed", err);
    } finally {
      setSummarizing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400 border-t border-slate-100 bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-2" />
        <p className="text-[10px] font-bold tracking-widest uppercase">Loading details...</p>
      </div>
    );
  }

  if (!details) {
    return <div className="p-4 text-center text-red-400 bg-red-50 border-t border-slate-100">Failed to load details</div>;
  }

  return (
    <div className="border-t border-slate-100 bg-white p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1">Cluster Breakdown</h3>
          <div className="flex gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>{details.postCount} Posts</span>
            <span>{details.misinformationCount} Misinfo Flags</span>
          </div>
        </div>
        {!details.aiSummary && (
          <button 
            onClick={handleSummarize} 
            disabled={summarizing}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            {summarizing ? <div className="w-3 h-3 border-2 border-emerald-300 border-t-emerald-700 rounded-full animate-spin" /> : <FileText className="w-3 h-3" />}
            {summarizing ? "Generating..." : "Generate AI Summary"}
          </button>
        )}
      </div>

      {details.aiSummary && (
        <div className="mb-6 bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">AI Generated Summary</p>
          <p className="text-sm font-black text-slate-900 mb-1">{details.aiSummary.headline}</p>
          <p className="text-xs text-slate-700 leading-relaxed">{details.aiSummary.summary}</p>
        </div>
      )}
      
      {/* Sentiments & Urgency */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Sentiment Distribution</p>
          <div className="space-y-1">
            {Object.entries(details.sentimentBreakdown || {}).map(([s, count]) => (
              <div key={s} className="flex justify-between items-center text-xs">
                <span className={SENTIMENT_COLORS[s]?.text || "text-slate-600 font-medium"}>{s}</span>
                <span className="font-bold text-slate-700 bg-white px-2 rounded-md shadow-sm border border-slate-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Urgency Levels</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(details.urgencyBreakdown || {}).map(([u, count]) => (
              <span key={u} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${URGENCY_COLORS[u] || ""}`}>
                {u} <span className="opacity-60 ml-1 font-mono">x{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">Recent Posts ({details.posts.length})</p>
      <div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar pr-2">
        {details.posts.map(post => {
          const sentimentStyle = SENTIMENT_COLORS[post.sentiment] || {};
          return (
            <div key={post._id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 shadow-sm relative">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/50">
                <div className="flex items-center gap-2">
                  {post.author?.avatar ? (
                    <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full border border-slate-200" />
                  ) : (
                    <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center border border-indigo-200">
                      <span className="text-[10px] font-bold text-indigo-700">
                        {(post.author?.username || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-900">{post.author?.username || 'Anonymous'}</span>
                </div>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-2 py-0.5 rounded-md border border-slate-100">
                  {getTimeAgo(post.createdAt)}
                </span>
              </div>
              <p className="text-sm font-black text-slate-800 tracking-tight leading-snug mb-1">{post.title}</p>
              {post.description && <p className="text-[11px] text-slate-600 mb-2 line-clamp-2 leading-relaxed font-medium">{post.description}</p>}
              <div className="flex gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sentimentStyle.bg || ""} ${sentimentStyle.text || ""}`}>
                  {post.sentiment || "—"}
                </span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${URGENCY_COLORS[post.urgency] || ""}`}>
                  {post.urgency || "—"}
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                  {post.postType || "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────

export default function CivicAnalytics() {
  const navigate = useNavigate();
  const [sentimentStats, setSentimentStats] = useState(null);
  const [emergingIssues, setEmergingIssues] = useState([]);
  const [misinformation, setMisinformation] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const [expandedCluster, setExpandedCluster] = useState(null);

  useEffect(() => {
    fetchAll();
  }, [days]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [statsRes, issuesRes, misRes, postsRes] = await Promise.allSettled([
        api.get(`/api/civic-analytics/sentiment-stats?days=${days}`),
        api.get("/api/civic-analytics/emerging-issues"),
        api.get("/api/civic-analytics/misinformation?limit=10"),
        api.get("/api/civic-analytics/posts?limit=20"),
      ]);

      if (statsRes.status === "fulfilled") setSentimentStats(statsRes.value.data);
      if (issuesRes.status === "fulfilled") setEmergingIssues(issuesRes.value.data.data || []);
      if (misRes.status === "fulfilled") setMisinformation(misRes.value.data.data || []);
      if (postsRes.status === "fulfilled") setPosts(postsRes.value.data.data || []);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateClusterMeta = (clusterId, aiSummary) => {
    setEmergingIssues(prev => prev.map(c => 
      c._id === clusterId ? { ...c, clusterMetadata: aiSummary } : c
    ));
  };
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/administration")}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Civic Analytics
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                UrbanConnect Intelligence
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div className="relative">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="appearance-none bg-white border border-slate-200 rounded-xl px-4 py-2 pr-8 text-sm font-bold text-slate-700 cursor-pointer hover:border-slate-300 transition-colors"
            >
              <option value={1}>Last 24h</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* ─── Top Stats Row ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={FileText}
              title="Analyzed Posts"
              value={sentimentStats?.total || 0}
              subtitle={`Last ${days} day${days > 1 ? "s" : ""}`}
            />
            <StatCard
              icon={BarChart3}
              title="Avg Sentiment"
              value={sentimentStats?.avgSentimentScore ?? "—"}
              subtitle="0 = Negative, 1 = Positive"
              theme="blue"
            />
            <StatCard
              icon={TrendingUp}
              title="Emerging Clusters"
              value={emergingIssues.length}
              subtitle="Active issue groups"
              theme="emerald"
            />
            <StatCard
              icon={ShieldAlert}
              title="Misinformation"
              value={misinformation.length}
              subtitle="Flagged posts"
              theme="red"
            />
          </div>

          {/* ─── Sentiment Distribution ─── */}
          {sentimentStats && sentimentStats.total > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-slate-400" />
                Sentiment Distribution
              </h2>
              <div className="space-y-3">
                {Object.entries(SENTIMENT_COLORS).map(([key, colors]) => (
                  <SentimentBar
                    key={key}
                    label={key}
                    count={sentimentStats.sentiment?.[key] || 0}
                    total={sentimentStats.total}
                    colors={colors}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ─── Emerging Issues ─── */}
          {emergingIssues.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Emerging Issues
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emergingIssues.map((cluster) => (
                  <div key={cluster._id} className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setExpandedCluster(expandedCluster === cluster._id ? null : cluster._id)}
                      className="w-full text-left p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono text-slate-400">{cluster._id}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {cluster.postCount} posts
                          </span>
                          <ChevronDown 
                            className={`w-4 h-4 text-slate-400 transition-transform ${expandedCluster === cluster._id ? 'rotate-180' : ''}`} 
                          />
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-800 line-clamp-2">
                        {cluster.clusterMetadata ? cluster.clusterMetadata.headline : cluster.latestPost}
                      </p>
                      {cluster.clusterMetadata && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {cluster.clusterMetadata.summary}
                        </p>
                      )}
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {(cluster.avgUrgency || []).slice(0, 5).map((u, i) => (
                          <span
                            key={i}
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${URGENCY_COLORS[u] || ""}`}
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    </button>
                    
                    {/* Expanded Detail View */}
                    {expandedCluster === cluster._id && (
                      <ClusterDetailView 
                        clusterId={cluster._id} 
                        onSummaryGenerated={(summaryData) => updateClusterMeta(cluster._id, summaryData)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Misinformation Feed ─── */}
          {misinformation.length > 0 && (
            <div className="bg-white rounded-2xl border border-red-100 p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900 mb-5 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Misinformation Feed
              </h2>
              <div className="space-y-3">
                {misinformation.map((post) => (
                  <div
                    key={post._id}
                    className="p-4 rounded-xl border border-red-50 bg-red-50/30 hover:bg-red-50/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{post.title}</h3>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {post.description}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                        FLAGGED
                      </span>
                    </div>
                    {post.aiAnalysis?.contextNote && (
                      <div className="mt-2 p-2.5 bg-white rounded-lg border border-red-100">
                        <p className="text-xs text-red-700 font-medium leading-relaxed">
                          <span className="font-black">Context Note:</span>{" "}
                          {post.aiAnalysis.contextNote}
                        </p>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 mt-2">
                      by {post.author?.username || "Unknown"} · {getTimeAgo(post.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ─── Post Analysis Table ─── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-slate-400" />
                Analyzed Posts
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {["Title", "Sentiment", "Urgency", "Type", "Misinfo?", "Cluster", "Time"].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {posts.map((post) => {
                    const ai = post.aiAnalysis || {};
                    const sentimentStyle = SENTIMENT_COLORS[ai.sentiment] || {};
                    return (
                      <tr key={post._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 max-w-[200px]">
                          <p className="text-sm font-bold text-slate-800 truncate">{post.title}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${sentimentStyle.bg || ""} ${sentimentStyle.text || ""}`}
                          >
                            {ai.sentiment || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${URGENCY_COLORS[ai.urgency] || ""}`}
                          >
                            {ai.urgency || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-500">
                            {ai.postType || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {ai.isMisinformation === true && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              YES
                            </span>
                          )}
                          {ai.isMisinformation === false && (
                            <span className="text-[10px] text-slate-400">No</span>
                          )}
                          {ai.isMisinformation == null && (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-slate-400">
                            {ai.clusterId || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {getTimeAgo(post.createdAt)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {posts.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                        No analyzed posts yet. Posts will appear here as users create them.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
