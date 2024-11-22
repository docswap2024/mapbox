import React from 'react';
import { styles } from './styles';

interface MapControlsProps {
    onFlyTo: () => void;
    onFlyBack: () => void;
    onGetLocation: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const MapControls: React.FC<MapControlsProps> = ({ onFlyTo, onFlyBack, onGetLocation }) => (
    <div className={styles.mapNav}>
        <ul id="btn-mom" className={styles.list}>
            <li>
                <a id="fly-back" onClick={onFlyBack} className={styles.button}>
                    <span><i className="fas fa-caret-left"></i></span>
                </a>
            </li>
            <li>
                <a id="fly-to" onClick={onFlyTo} className={styles.button}>
                    <span><i className="fas fa-caret-right"></i></span>
                </a>
            </li>
        </ul>
        <div id="user-location" className={`${styles.button} ml-1 mt-2`} onClick={onGetLocation}>
            <span><i className="fas fa-location"></i></span>
        </div>
    </div>
);

export default MapControls;
