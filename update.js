const fs = require('fs');

const file = 'e:/Work/VSCode Repo/GymBro/gymbro/app/progress/page.tsx';
let data = fs.readFileSync(file, 'utf8');

// Replace useMemo for start and end
const newUseMemo =   const { start, end, quarter, year } = useMemo(() => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const targetQuarter = currentQuarter + bmiIntervalOffset;
    
    // Calculate year and quarter properly handling negative targetQuarter
    const yearOffset = Math.floor(targetQuarter / 4);
    const q = ((targetQuarter % 4) + 4) % 4;
    const y = now.getFullYear() + yearOffset;
    
    const startMonth = q * 3;
    const startDate = new Date(y, startMonth, 1);
    
    const endDate = new Date(y, startMonth + 3, 0, 23, 59, 59, 999);
    
    return { start: startDate, end: endDate, quarter: q + 1, year: y };
  }, [bmiIntervalOffset]);;

data = data.replace(
  /  const { start, end } = useMemo\(\(\) => {[\s\S]*?return { start: startDate, end: endDate };\n  }, \[bmiIntervalOffset\]\);/,
  newUseMemo
);

// Replace the graph section
const newGraph =           <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="text-pink-500" />
              <h2 className="text-xl font-bold text-white">BMI History</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setBmiIntervalOffset(prev => prev - 1)} 
                className="p-1 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors"
                aria-label="Previous Quarter"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <span className="text-xs text-zinc-300 font-medium">
                Q{quarter} {year}
              </span>
              <button 
                onClick={() => setBmiIntervalOffset(prev => prev + 1)} 
                className="p-1 text-zinc-400 hover:text-white bg-zinc-800 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                disabled={bmiIntervalOffset >= 0} 
                aria-label="Next Quarter"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          </div>
          <div className="flex-1 bg-zinc-800/30 rounded-2xl border border-zinc-800/50 p-4 relative flex flex-col">
            {bmiLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
              </div>
            ) : filteredBmi.length > 0 ? (
              <div className="w-full h-full flex flex-col relative">
                <div className="flex-1 flex pl-6 pb-6 relative">
                  {/* Y-axis Labels */}
                  <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-between items-start text-[10px] text-zinc-500">
                    <span>{Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1)}</span>
                    <span>{((Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1) + Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1))) / 2).toFixed(1)}</span>
                    <span>{Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1))}</span>
                  </div>
                  
                  {/* Chart Area */}
                  <div className="flex-1 relative border-l border-b border-zinc-700/50">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                      <polyline 
                        fill="none" 
                        stroke="#ec4899" 
                        strokeWidth="2" 
                        points={filteredBmi.map((d, i) => {
                          const minBmi = Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1));
                          const maxBmi = Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1);
                          const range = maxBmi - minBmi || 1;
                          const x = filteredBmi.length > 1 ? (i / (filteredBmi.length - 1)) * 100 : 50;
                          const y = 100 - ((d.bmi - minBmi) / range) * 100;
                          return \\\\\\,\\\\\\;
                        }).join(' ')} 
                      />
                      {filteredBmi.map((d, i) => {
                          const minBmi = Math.floor(Math.max(0, Math.min(...filteredBmi.map(b => b.bmi)) - 1));
                          const maxBmi = Math.ceil(Math.max(...filteredBmi.map(b => b.bmi)) + 1);
                          const range = maxBmi - minBmi || 1;
                          const x = filteredBmi.length > 1 ? (i / (filteredBmi.length - 1)) * 100 : 50;
                          const y = 100 - ((d.bmi - minBmi) / range) * 100;
                          return (
                            <g key={i} className="group">
                              <circle cx={x} cy={y} r="2" fill="#ec4899" className="opacity-80 transition-opacity" />
                              <circle cx={x} cy={y} r="5" fill="transparent" className="cursor-pointer" />
                              <text x={x} y={y - 5} fill="white" fontSize="4" textAnchor="middle" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">{d.bmi}</text>
                            </g>
                          );
                      })}
                    </svg>
                  </div>
                  
                  {/* X-axis Labels */}
                  <div className="absolute left-6 right-0 bottom-0 h-6 flex justify-between items-end text-[10px] text-zinc-500 px-1">
                    {filteredBmi.map((d, i) => {
                      if (i === 0 || i === filteredBmi.length - 1 || filteredBmi.length <= 4 || i % Math.ceil(filteredBmi.length/4) === 0) {
                        return (
                          <span key={i} className="absolute transform -translate-x-1/2" style={{left: \\\\\\%\\\}}>
                            {d.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-zinc-500 text-sm">No BMI data in this quarter.</p>
              </div>
            )}
          </div>;

data = data.replace(
  /          <div className="flex items-center justify-between mb-6">[\s\S]*?(?=        <\/div>\n      <\/div>\n    <\/div>\n  \);\n})/m,
  newGraph + '\n'
);

fs.writeFileSync(file, data);
console.log('Update completed');
