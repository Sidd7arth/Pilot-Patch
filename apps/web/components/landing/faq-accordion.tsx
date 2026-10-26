'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: 'What is PatchPilot?',
    answer:
      'PatchPilot is an evidence-first content-investment and prioritization decision platform for live-service and free-to-play game studios. It combines real cultural-intelligence taste signals from Qloo with internal production budgets, engineering capacity, and release schedules to generate explainable portfolio recommendations.',
  },
  {
    question: 'How does Qloo fit into the workflow?',
    answer:
      'Qloo operates as the cultural intelligence layer. When game producers propose seasonal events, IP collaborations, or themed bundles, PatchPilot queries official Qloo endpoints to retrieve affinity data connecting the game’s player audience to artists, anime, entertainment franchises, and regional trends across target geographic markets.',
  },
  {
    question: 'Does cultural affinity predict revenue or commercial ROI?',
    answer:
      'No. PatchPilot strictly enforces scientific and commercial honesty: cultural affinity is taste alignment, not purchase intent. An audience having high affinity for an artist does not guarantee in-game spending. PatchPilot uses cultural signals as structured hypotheses alongside operational feasibility, never as financial forecasts.',
  },
  {
    question: 'Can teams change their budget and compare scenarios?',
    answer:
      'Yes. The decision engine is deterministic and zero-IO. In the Compare & Replan module, teams can tweak total budgets, contingency reserves, or sprint capacity to immediately compute alternative shortlists, inspect portfolio diffs, and see which proposals enter or leave the funded scope.',
  },
  {
    question: 'Does PatchPilot publish updates or modify live services automatically?',
    answer:
      'No. PatchPilot is an executive decision-support tool, not an autonomous publisher. It outputs explainable rankings, trade-off matrices, and downloadable Markdown decision briefs. The final creative, strategic, and commercial decisions always remain under human control.',
  },
  {
    question: 'What happens if relevant cultural data is unavailable for a proposal?',
    answer:
      'Missing evidence is never treated as negative evidence. If a proposal does not have cultural reference data or external analogs, that criterion evaluates to null, and the scoring engine automatically renormalizes weights across the remaining available criteria without penalizing the proposal.',
  },
];

export function FAQAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-3.5 max-w-3xl mx-auto">
      {FAQS.map((faq, idx) => {
        const isOpen = openIndex === idx;
        const headingId = `faq-heading-${idx}`;
        const panelId = `faq-panel-${idx}`;

        return (
          <div
            key={idx}
            className={`rounded-xl border transition-all duration-200 ${
              isOpen
                ? 'bg-white border-[#7865F5]/40 shadow-sm'
                : 'bg-white/80 hover:bg-white border-[#E5E8F1]'
            }`}
          >
            <button
              type="button"
              id={headingId}
              aria-controls={panelId}
              aria-expanded={isOpen}
              onClick={() => toggle(idx)}
              className="w-full flex items-center justify-between p-5 text-left text-slate-900 font-semibold text-base gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7865F5] rounded-xl"
            >
              <span>{faq.question}</span>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                  isOpen
                    ? 'rotate-180 bg-[#7865F5]/10 text-[#7865F5]'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={headingId}
                className="px-5 pb-5 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
              >
                {faq.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
