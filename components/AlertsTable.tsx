import React, { useState } from 'react';
import { Alert, ArticleReference } from '../types';
import { ShieldAlert, ChevronDown, Paperclip, ExternalLink } from 'lucide-react';

interface AlertsTableProps {
  alerts: Alert[];
}

const AlertRow: React.FC<{ alert: Alert }> = ({ alert }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasReferences = alert.references && alert.references.length > 0;

  return (
    <>
      <tr 
        className={`bg-white border-b hover:bg-red-50/50 transition-colors ${hasReferences ? 'cursor-pointer' : ''}`}
        onClick={() => hasReferences && setIsOpen(!isOpen)}
      >
        <td className="px-6 py-4 font-semibold text-gray-900 flex items-center gap-2">
          {alert.sector === 'OCP' && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
          {alert.sector === 'Maroc' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
          {alert.sector === 'Afrique' && <span className="w-2 h-2 rounded-full bg-yellow-500"></span>}
          {alert.sector}
        </td>
        <td className="px-6 py-4 font-medium text-gray-800">{alert.event}</td>
        <td className="px-6 py-4 text-gray-600 italic">"{alert.impact}"</td>
        <td className="px-6 py-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
              alert.severity === 'high' ? 'bg-red-100 text-red-800' :
              alert.severity === 'medium' ? 'bg-orange-100 text-orange-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {alert.severity.toUpperCase()}
            </span>
            {hasReferences && (
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </td>
      </tr>
      {hasReferences && isOpen && (
        <tr className="bg-red-50/30">
          <td colSpan={4} className="p-0">
            <div className="px-8 py-4">
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Paperclip className="w-3 h-3" />
                Sources Directes de l'Alerte
              </h4>
              <ul className="space-y-1.5 pl-1">
                {alert.references?.map((ref, i) => (
                  <li key={i}>
                    <a 
                      href={ref.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-start gap-1.5 text-xs text-blue-700 hover:text-blue-900 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{ref.title} <span className="text-gray-500 font-medium">({ref.source})</span></span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

const AlertsTable: React.FC<AlertsTableProps> = ({ alerts }) => {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-100 overflow-hidden mb-8 animate-fade-in">
      <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <h2 className="text-lg font-bold tracking-wide uppercase">Alertes Critiques du Jour</h2>
        </div>
        <span className="bg-red-800 text-red-100 text-xs font-medium px-2.5 py-0.5 rounded-full border border-red-600">
          Priorité Haute
        </span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-600">
          <thead className="text-xs text-gray-700 uppercase bg-red-50">
            <tr>
              <th scope="col" className="px-6 py-3 font-bold">Secteur</th>
              <th scope="col" className="px-6 py-3 font-bold">Événement</th>
              <th scope="col" className="px-6 py-3 font-bold">Impact</th>
              <th scope="col" className="px-6 py-3 font-bold text-center">Niveau</th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, index) => (
              <AlertRow key={index} alert={alert} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AlertsTable;