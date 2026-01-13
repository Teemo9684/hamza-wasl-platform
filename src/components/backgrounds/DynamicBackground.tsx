import React, { useMemo, useEffect, useState } from 'react';
import { detectCurrentOccasion, OccasionType } from '@/utils/occasionDetector';
import RamadanBackground from './RamadanBackground';
import EidBackground from './EidBackground';
import NationalBackground from './NationalBackground';
import SchoolBackground from './SchoolBackground';
import SeasonBackground from './SeasonBackground';
import AmazighBackground from './AmazighBackground';
import MawlidBackground from './MawlidBackground';

interface DynamicBackgroundProps {
  children?: React.ReactNode;
}

const DynamicBackground: React.FC<DynamicBackgroundProps> = ({ children }) => {
  const [currentOccasion, setCurrentOccasion] = useState(detectCurrentOccasion());

  // Update occasion at midnight
  useEffect(() => {
    const checkOccasion = () => {
      const newOccasion = detectCurrentOccasion();
      if (newOccasion.type !== currentOccasion.type) {
        setCurrentOccasion(newOccasion);
      }
    };

    // Check every hour
    const interval = setInterval(checkOccasion, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [currentOccasion.type]);

  const BackgroundComponent = useMemo(() => {
    switch (currentOccasion.type) {
      case 'ramadan':
        return RamadanBackground;
      case 'eid_fitr':
      case 'eid_adha':
        return EidBackground;
      case 'mawlid':
      case 'islamic_new_year':
        return MawlidBackground;
      case 'independence_day':
      case 'revolution_day':
      case 'martyrs_day':
      case 'youth_day':
        return NationalBackground;
      case 'amazigh_new_year':
        return AmazighBackground;
      case 'knowledge_day':
      case 'teacher_day':
      case 'school_start':
      case 'school_end':
        return SchoolBackground;
      case 'winter_vacation':
      case 'spring_vacation':
      case 'spring':
      case 'summer':
      case 'autumn':
      case 'winter':
        return SeasonBackground;
      default:
        return SeasonBackground;
    }
  }, [currentOccasion.type]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackgroundComponent occasionType={currentOccasion.type} occasionName={currentOccasion.nameAr} />
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default DynamicBackground;
