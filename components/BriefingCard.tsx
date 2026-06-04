
import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { BriefingSection, BriefingPoint, LoadingState } from '../types';
import { generateBriefingSection } from '../services/geminiService';
import { LucideIcon, ChevronDown, Dot, ExternalLink, Paperclip, AlertTriangle, RefreshCw, Download, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface BriefingCardProps {
  sectionType: string;
  icon: LucideIcon;
  colorClass: string;
  title: string;
  borderColorClass: string;
  trigger: number;
  loadIndex: number;
}

const CollapsibleListItem: React.FC<{ point: BriefingPoint }> = ({ point }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0 pdf-item">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="w-full flex justify-between items-center text-left py-3 px-6 hover:bg-gray-50 focus:outline-none focus-visible:bg-gray-100"
      >
        <span className="font-semibold text-gray-800 text-sm flex items-center gap-2">
           <Dot className="w-6 h-6 text-gray-400 flex-shrink-0" /> 
           {point.subTitle}
        </span>
        <ChevronDown 
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>
      {/* Pour le PDF, on force l'affichage du contenu même si fermé dans l'UI, 
          mais html2canvas capture ce qui est visible. 
          Pour l'instant, l'export PDF capturera l'état visuel actuel. */}
      <div 
        className={`transition-[max-height,padding] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[1000px] pb-4' : 'max-h-0'}`}
      >
        <div className="px-6 ml-6 border-l-2 border-gray-200 pl-4">
            <ReactMarkdown
              className="prose prose-sm max-w-none text-gray-700"
              components={{
                  ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1" {...props} />,
                  li: ({node, ...props}) => <li className="text-gray-600" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-gray-800" {...props} />,
              }}
            >
              {point.details}
            </ReactMarkdown>

            {point.verificationNeeded && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-yellow-600" />
                <div>
                  <h5 className="font-bold">Point à vérifier</h5>
                  <p className="mt-1">{point.verificationNeeded}</p>
                </div>
              </div>
            )}

            {point.references && point.references.length > 0 && (
            <div className="mt-4">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-3 h-3" />
                    Sources Directes
                </h4>
                <ul className="mt-2 space-y-1.5 pl-1">
                {point.references.map((ref, i) => (
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
            )}
        </div>
      </div>
    </div>
  );
};


const BriefingCard: React.FC<BriefingCardProps> = ({ sectionType, icon: Icon, colorClass, borderColorClass, trigger, title, loadIndex }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [section, setSection] = useState<BriefingSection | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.LOADING);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Ref pour capturer le contenu du briefing
  const contentRef = useRef<HTMLDivElement>(null);
  
  const fetchSectionData = React.useCallback(async () => {
      setLoadingState(LoadingState.LOADING);
      try {
          const data = await generateBriefingSection(sectionType);
          setSection(data);
          setLoadingState(LoadingState.SUCCESS);
      } catch (error) {
          console.error(`Failed to load section ${sectionType}:`, error);
          setSection(null);
          setLoadingState(LoadingState.ERROR);
      }
  }, [sectionType]);

  useEffect(() => {
    if (trigger > 0) {
      // Stagger API calls to avoid hitting rate limits.
      const delay = loadIndex * 1500; // 1.5 second delay between each card load.
      const timer = setTimeout(() => {
        fetchSectionData();
      }, delay);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, fetchSectionData, loadIndex]);

  const handleDownloadPdf = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher la fermeture de l'accordéon
    if (!contentRef.current || !section) return;

    setIsDownloading(true);
    
    // Si la carte est fermée, on l'ouvre temporairement (optionnel, ici on suppose que l'utilisateur imprime ce qu'il voit)
    if (!isExpanded) {
        setIsExpanded(true);
        // Petit délai pour laisser le temps à l'animation CSS de se faire (ou on force le rendu)
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    try {
        const element = contentRef.current;
        
        // Capture du DOM en canvas
        const canvas = await html2canvas(element, {
            scale: 2, // Meilleure résolution
            backgroundColor: '#ffffff',
            useCORS: true // Pour charger les images externes si possible
        });

        const imgData = canvas.toDataURL('image/png');
        
        // Création du PDF A4
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        // Calcul des dimensions pour faire tenir l'image dans le PDF avec des marges
        const margin = 10;
        const availableWidth = pdfWidth - (margin * 2);
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = availableWidth / imgWidth;
        const finalHeight = imgHeight * ratio;

        // En-tête du PDF
        pdf.setFontSize(16);
        pdf.setTextColor(40, 40, 40);
        pdf.text(section.title || title, margin, 15);
        
        pdf.setFontSize(10);
        pdf.setTextColor(100, 100, 100);
        pdf.text(`Briefing généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, 22);

        // Ajout de l'image du contenu
        // Si le contenu est très long, jsPDF ne gère pas automatiquement le saut de page avec addImage.
        // Pour une version simple, on ajoute l'image telle quelle.
        pdf.addImage(imgData, 'PNG', margin, 30, availableWidth, finalHeight);

        pdf.save(`Briefing_${sectionType}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (err) {
        console.error("Erreur lors de la génération du PDF", err);
        alert("Une erreur est survenue lors de la création du PDF.");
    } finally {
        setIsDownloading(false);
    }
  };

  const renderContent = () => {
    switch (loadingState) {
        case LoadingState.LOADING:
            return (
                <div className="p-6 space-y-4 animate-pulse">
                    {[...Array(3)].map((_, i) => (
                        <div key={i}>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            );
        case LoadingState.ERROR:
             return <div className="p-6 text-center text-sm">
                <AlertTriangle className="w-8 h-8 mx-auto text-red-400 mb-2" />
                <p className="text-red-600 font-semibold mb-3">Impossible de charger cette section.</p>
                <p className="text-gray-500 mb-4">Une erreur est survenue lors de la communication avec l'IA.</p>
                <button
                    onClick={fetchSectionData}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg shadow-sm hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-all"
                >
                    <RefreshCw className="w-4 h-4" />
                    Réessayer
                </button>
            </div>;
        case LoadingState.SUCCESS:
             if (!section || !section.content || section.content.length === 0) {
                return <p className="p-6 text-sm text-gray-500 italic">Aucun point de briefing disponible pour cette section.</p>;
             }
             return (
                <div className="py-2" ref={contentRef}>
                    <div className="px-6 py-2 md:hidden block">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">{section.title}</h2>
                        <hr className="border-gray-200"/>
                    </div>
                    {section.content.map((point, index) => (
                        <CollapsibleListItem key={index} point={point} />
                    ))}
                </div>
             );
        default:
            return null;
    }
  }


  return (
    <div className={`bg-white rounded-xl shadow-sm border-t-4 ${borderColorClass} flex flex-col h-full overflow-hidden transition-all duration-300 hover:shadow-md`}>
      <div
        className={`w-full px-6 py-4 border-b border-gray-100 ${colorClass} bg-opacity-5 flex items-center justify-between transition-colors hover:bg-opacity-10`}
      >
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-3 flex-grow text-left focus:outline-none"
        >
            <div className={`p-2 rounded-lg ${colorClass} bg-opacity-10 ${borderColorClass.replace('border-', 'text-')}`}>
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">{section?.title || title}</h3>
        </button>

        <div className="flex items-center gap-2">
            {loadingState === LoadingState.SUCCESS && (
                <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloading}
                    title="Exporter la section en PDF"
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors focus:outline-none"
                >
                    {isDownloading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                        <Download className="w-5 h-5" />
                    )}
                </button>
            )}
            <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-gray-500 hover:text-gray-800 rounded-full focus:outline-none"
            >
                <ChevronDown 
                className={`w-5 h-5 transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                />
            </button>
        </div>
      </div>
      
      <div 
        className={`transition-[max-height] duration-500 ease-in-out overflow-y-auto ${isExpanded ? 'max-h-[2000px]' : 'max-h-0'}`}
      >
        {renderContent()}
      </div>

      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 mt-auto">
        <p className="text-xs text-gray-400 font-mono text-center">Mise à jour par IA</p>
      </div>
    </div>
  );
};

export default BriefingCard;
