
import React from 'react';

interface IconProps {
    name: string;
    className?: string;
    fill?: boolean;
    onClick?: () => void;
}

export const Icon: React.FC<IconProps> = ({ name, className = '', fill = false, onClick }) => {
    return (
        <span
            className={`material-symbols-outlined ${className} ${fill ? 'font-variation-fill' : ''}`}
            style={{ fontVariationSettings: fill ? "'FILL' 1" : "'FILL' 0" }}
            onClick={onClick}
        >
            {name}
        </span>
    );
};
