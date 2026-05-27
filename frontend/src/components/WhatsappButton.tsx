import { useState, useEffect } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';
import { getContato } from '../services/testes';

interface WhatsappButtonProps {
    phoneNumber?: string;
    message?: string;
}

export default function WhatsappButton({
    phoneNumber: propPhoneNumber,
    message: propMessage
}: WhatsappButtonProps) {
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('whatsapp-minimized');
        return saved === 'true';
    });

    const [whatsapp, setWhatsapp] = useState(propPhoneNumber || '');
    const [mensagem, setMensagem] = useState(propMessage || '');

    useEffect(() => {
        localStorage.setItem('whatsapp-minimized', String(isMinimized));
    }, [isMinimized]);

    useEffect(() => {
        async function fetchContact() {
            try {
                const data = await getContato();
                if (data) {
                    if (!propPhoneNumber && data.whatsapp) {
                        setWhatsapp(data.whatsapp);
                    }
                    if (!propMessage && data.mensagem) {
                        setMensagem(data.mensagem);
                    }
                }
            } catch (error) {
                console.error('Erro ao buscar dados de contato para o WhatsApp:', error);
            }
        }
        fetchContact();
    }, [propPhoneNumber, propMessage]);

    const activePhoneNumber = whatsapp || propPhoneNumber || '5511999999999';
    const activeMessage = mensagem || propMessage || 'Olá! Gostaria de mais informações.';

    const handleClick = () => {
        let cleanNumber = activePhoneNumber.replace(/\D/g, '');
        // Se o número for brasileiro e não tiver código de país, adiciona 55
        if (cleanNumber.length === 10 || cleanNumber.length === 11) {
            cleanNumber = '55' + cleanNumber;
        }
        const encodedMessage = encodeURIComponent(activeMessage);
        const whatsappUrl = `https://wa.me/${cleanNumber}?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };

    if (isMinimized) {
        return (
            <button
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-4 right-4 z-40 bg-green-500/80 hover:bg-green-500 text-white p-2 rounded-full shadow-md transition-all duration-300"
                aria-label="Abrir WhatsApp"
            >
                <FaWhatsapp size={16} />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 animate-fade-in">
            <button
                onClick={() => setIsMinimized(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                aria-label="Minimizar"
            >
                <FaTimes size={12} />
            </button>
            <button
                onClick={handleClick}
                className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 group"
                aria-label="Contato via WhatsApp"
            >
                <FaWhatsapp size={18} />
                <span className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-800/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                    Fale conosco
                </span>
            </button>
        </div>
    );
}