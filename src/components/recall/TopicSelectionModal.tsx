/**
 * CARE - TopicSelectionModal Component
 * Searchable, paginated index of logged topics with real-time text search,
 * category filter pills, and sorting toggles for manual recall selection.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  X,
  Brain,
  Sparkles,
  Flame,
  Clock,
  Filter,
  ArrowUpRight,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { TopicRetentionState } from '../../types';
import { api } from '../../lib/api';

interface TopicSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (topic: TopicRetentionState) => void;
}

export const TopicSelectionModal: React.FC<TopicSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'recency' | 'ai_signal' | 'alphabetical'>('priority');
  const [topics, setTopics] = useState<TopicRetentionState[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTopics = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getRecallTopics({
        search: searchTerm.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sortBy,
        limit: 50,
      });
      setTopics(res.topics);
      setTotalCount(res.total);
      if (res.categories && res.categories.length > 0) {
        setCategories(res.categories);
      }
    } catch (err) {
      console.error('Failed to query recall topics:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedCategory, sortBy]);

  useEffect(() => {
    if (isOpen) {
      fetchTopics();
    }
  }, [isOpen, fetchTopics]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="topic-selection-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="topic-selection-modal-content"
        className="bg-stone-900 border border-stone-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-stone-800 flex items-center justify-between bg-stone-925">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-100">
                Select Topic for Recall
              </h3>
              <p className="text-xs text-stone-400">
                Choose any tracked concept from your knowledge base for an targeted Socratic session
              </p>
            </div>
          </div>

          <button
            id="btn-close-topic-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-stone-800/80 bg-stone-900 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="input-topic-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by topic name or keyword (e.g. Attention, LoRA, Cross-Validation)..."
              className="w-full pl-10 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-lg text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Filter Pills & Sort Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Category Pills */}
            <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto pb-1 max-w-full">
              <span className="text-[11px] text-stone-400 flex items-center gap-1 mr-1">
                <Filter className="w-3 h-3 text-stone-400" />
                Category:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-500 text-stone-950 font-semibold'
                    : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors font-medium ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-stone-950 font-semibold'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-750'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Toggle */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-stone-400">Sort:</span>
              <select
                id="select-topic-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-950 border border-stone-800 rounded-md text-xs py-1 px-2.5 text-stone-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="priority">Priority(t) Desc</option>
                <option value="ai_signal">AI Reliance Signal</option>
                <option value="recency">Most Recently Logged</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Topic List Results */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 min-h-[260px]">
          {isLoading ? (
            <div className="py-12 text-center text-stone-400 space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Querying calibrated topics...</p>
            </div>
          ) : topics.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto mb-3 text-stone-500">
                <Brain className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-stone-200">No Matching Topics Found</h4>
              <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                Try adjusting your search keywords or category filters, or log a new work journal entry to identify new topics.
              </p>
            </div>
          ) : (
            topics.map((topic) => {
              const score = topic.currentPriorityScore;
              const isUrgent = score >= 60;
              const isModerate = score >= 35 && score < 60;
              const priorityBadge = isUrgent
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : isModerate
                ? 'bg-amber-950/60 text-amber-300 border-amber-800'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-800';

              const lastDate = new Date(topic.lastLoggedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              });

              return (
                <div
                  key={topic.topicId}
                  id={`select-topic-item-${topic.topicId}`}
                  onClick={() => onSelectTopic(topic)}
                  className="bg-stone-925 hover:bg-stone-850 border border-stone-800 hover:border-emerald-500/60 rounded-xl p-3.5 sm:p-4 transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-800 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 text-stone-400 flex items-center justify-center shrink-0 mt-0.5 transition-colors">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-stone-100 group-hover:text-emerald-300 transition-colors">
                          {topic.canonicalName}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-800 text-stone-400 border border-stone-750 uppercase">
                          {topic.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-stone-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" />
                          Logged: {lastDate}
                        </span>
                        <span>•</span>
                        <span>Occurrences: <strong className="text-stone-300 font-mono">{topic.journalOccurrences}</strong></span>
                        <span>•</span>
                        <span>
                          AI Signal: <strong className="text-stone-300 font-mono">{(topic.effectiveAiAssistanceWeight * 100).toFixed(0)}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-stone-500">Decay Score</div>
                      <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold border ${priorityBadge}`}>
                        {isUrgent && <Flame className="w-3 h-3 text-rose-400" />}
                        <span>{score.toFixed(1)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-lg bg-stone-800 group-hover:bg-emerald-500 group-hover:text-stone-950 text-stone-300 transition-colors"
                      title="Select topic"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-925 flex items-center justify-between text-xs text-stone-400">
          <span className="font-mono">
            Showing {topics.length} of {totalCount} total topic{totalCount === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-stone-800 hover:bg-stone-750 text-stone-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
