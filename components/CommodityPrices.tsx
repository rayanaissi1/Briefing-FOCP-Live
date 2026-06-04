import React from 'react';
import { CommodityPrice } from '../types';
import { TrendingUp, TrendingDown, Minus, DollarSign, History } from 'lucide-react';

interface CommodityPricesProps {
  prices: CommodityPrice[];
  marketAnalysis?: string;
}

const CommodityPrices: React.FC<CommodityPricesProps> = ({ prices, marketAnalysis }) => {
  if (!prices || prices.length === 0) return null;

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-green-600" />
        Cours des Matières Premières & Gaz
      </h2>
      
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm text-left text-gray-600 bg-white rounded-xl border border-gray-200 shadow-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                    <th className="px-6 py-3 font-bold">Commodity</th>
                    <th className="px-6 py-3 font-bold text-right">Prix Actuel</th>
                    <th className="px-6 py-3 font-bold text-right">Var. (J)</th>
                    <th className="px-6 py-3 font-bold text-right text-gray-500">Prix (N-1)</th>
                    <th className="px-6 py-3 font-bold text-right">Évolution (1 an)</th>
                    <th className="px-6 py-3 font-bold">Tendance</th>
                </tr>
            </thead>
            <tbody>
                {prices.map((item, index) => {
                    const isUp = item.trend === 'up';
                    const isDown = item.trend === 'down';
                    const isStable = item.trend === 'stable';
                    
                    return (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50 transition-colors last:border-0">
                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 text-right font-bold font-mono">
                                {item.price} <span className="text-xs text-gray-400 font-normal">{item.unit}</span>
                            </td>
                            <td className={`px-6 py-4 text-right font-bold ${item.change.includes('+') ? 'text-green-600' : item.change.includes('-') ? 'text-red-600' : 'text-gray-600'}`}>
                                {item.change}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-500 font-mono">
                                {item.lastYearPrice}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    item.evolution.includes('+') ? 'bg-green-100 text-green-800' : 
                                    item.evolution.includes('-') ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                    {item.evolution}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-1">
                                    {isUp && <TrendingUp className="w-4 h-4 text-green-500" />}
                                    {isDown && <TrendingDown className="w-4 h-4 text-red-500" />}
                                    {isStable && <Minus className="w-4 h-4 text-gray-400" />}
                                    <span className="text-xs text-gray-500">{item.analysis}</span>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
      
      {marketAnalysis && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2 flex items-center gap-1">
                <History className="w-3 h-3" />
                Analyse du Marché
            </h3>
            <p className="text-sm text-gray-700 leading-relaxed">{marketAnalysis}</p>
        </div>
      )}
    </div>
  );
};

export default CommodityPrices;
