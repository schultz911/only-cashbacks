import React from 'react';
import { CustomSelect } from './LoungeTrackerModal';

interface VoucherSectionProps {
  selectedVoucherPortal: string;
  setSelectedVoucherPortal: (portal: string) => void;
  voucherPortals: Record<string, string>;
  className?: string;
}

export const VoucherSection: React.FC<VoucherSectionProps> = React.memo(({
  selectedVoucherPortal,
  setSelectedVoucherPortal,
  voucherPortals,
  className
}) => {
  return (
    <section className={className}>
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight">Voucher Portals</h2>
        <p className="text-gray-500 text-xs">Select your portal to check card pairing.</p>
      </div>
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-5 rounded-3xl border border-gray-200/60 dark:border-gray-800 shadow-sm flex flex-col gap-4 min-h-[180px] relative group z-20">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-transparent pointer-events-none rounded-3xl overflow-hidden" />
        <div className="relative z-50 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors shadow-inner">
          <CustomSelect
            value={selectedVoucherPortal}
            onChange={setSelectedVoucherPortal}
            options={Object.keys(voucherPortals).map(portal => ({ 
              label: portal === 'tata neu' ? 'Tata Neu' : portal.charAt(0).toUpperCase() + portal.slice(1), 
              value: portal 
            }))}
            placeholder="Select a portal..."
            className="w-full px-4 py-3 font-medium text-gray-800 dark:text-gray-200"
            dropdownClassName="w-full left-0 right-0 top-full"
            fullOpacity={true}
          />
        </div>
        <div className="p-4 bg-purple-50/80 dark:bg-purple-900/20 backdrop-blur-sm border border-purple-100/50 dark:border-purple-800/30 rounded-2xl flex items-center justify-between mt-auto gap-3 flex-wrap relative z-10">
          <span className="text-sm font-semibold text-purple-900 dark:text-purple-300 shrink-0">Best Card:</span>
          {selectedVoucherPortal ? (
            <span className="text-sm font-bold text-purple-700 dark:text-purple-200 bg-white/90 dark:bg-purple-900/50 px-3 py-1 rounded-xl shadow-sm text-right border border-purple-100 dark:border-purple-800/50 backdrop-blur-md">
              {voucherPortals[selectedVoucherPortal]}
            </span>
          ) : (
            <span className="text-sm font-medium text-purple-700/60 dark:text-purple-300/50 italic">
              Pending selection
            </span>
          )}
        </div>
      </div>
    </section>
  );
});
