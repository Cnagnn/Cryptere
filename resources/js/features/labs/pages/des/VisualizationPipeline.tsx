/**
 * VisualizationPipeline — Main visualization area for DES
 * Renders different steps based on currentStep (0-17)
 */

import { AnimatePresence, motion } from 'framer-motion';

import type { DesTrace } from '@/types/labs';

import FeistelRoundStep from './steps/FeistelRoundStep';
import FinalPermutationStep from './steps/FinalPermutationStep';
import InitialPermutationStep from './steps/InitialPermutationStep';

interface VisualizationPipelineProps {
    trace: DesTrace;
    currentStep: number;
    learnerMode: 'pemula' | 'mahir';
}

export default function VisualizationPipeline({
    trace,
    currentStep,
    learnerMode,
}: VisualizationPipelineProps) {
    const renderStep = () => {
        if (currentStep === 0) {
            return <InitialPermutationStep trace={trace} />;
        } else if (currentStep >= 1 && currentStep <= 16) {
            const roundIndex = currentStep - 1;

            return (
                <FeistelRoundStep
                    trace={trace}
                    roundIndex={roundIndex}
                    learnerMode={learnerMode}
                />
            );
        } else if (currentStep === 17) {
            return <FinalPermutationStep trace={trace} />;
        }

        return null;
    };

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
            >
                {renderStep()}
            </motion.div>
        </AnimatePresence>
    );
}
