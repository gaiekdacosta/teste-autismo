import { useState, useEffect } from 'react';
import { FaWhatsapp, FaTimes } from 'react-icons/fa';

interface WhatsappButtonProps {
    phoneNumber?: string;
    message?: string;
}

export default function WhatsappButton({
    phoneNumber = '5511999999999',
    message = 'Olá! Gostaria de mais informações.'
}: WhatsappButtonProps) {
    const [isMinimized, setIsMinimized] = useState(() => {
        const saved = localStorage.getItem('whatsapp-minimized');
        return saved === 'true';
    });

    useEffect(() => {
        localStorage.setItem('whatsapp-minimized', String(isMinimized));
    }, [isMinimized]);

    const handleClick = () => {
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
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