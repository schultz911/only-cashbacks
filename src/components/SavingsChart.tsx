import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

interface Props {
  chartData: { name: string; value: number }[];
  colors: string[];
}

export default function SavingsChart({ chartData, colors }: Props) {
  return (
    <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={chartData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={67}
                              paddingAngle={4}
                              dataKey="value"
                              isAnimationActive={false}
                            >
                              {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => `₹${value.toFixed(2)}`}
                              contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                borderRadius: '12px',
                                border: '1px solid rgba(0, 0, 0, 0.05)',
                                boxShadow: '0 8px 16px -4px rgba(0, 0, 0, 0.1)',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                color: '#1f2937'
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
  );
}
