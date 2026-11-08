import React, { useState } from 'react';
import { Modal } from './Modal';
import { Field } from './Field';
import { Button } from './Button';
import { useTeachDeskStore } from '../../hooks/useTeachDeskStore';
import { KeyRound, ShieldCheck } from 'lucide-react';

interface AISettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AISettingsModal: React.FC<AISettingsModalProps> = ({ isOpen, onClose }) => {
  const { aiSettings, updateAiSettings } = useTeachDeskStore();
  const [apiKey, setApiKey] = useState(aiSettings.apiKey);
  const [baseUrl, setBaseUrl] = useState(aiSettings.baseUrl);
  const [chatModel, setChatModel] = useState(aiSettings.chatModel);
  const [visionModel, setVisionModel] = useState(aiSettings.visionModel);
  const [transcriptionModel, setTranscriptionModel] = useState(aiSettings.transcriptionModel);
  const [showKey, setShowKey] = useState(false);

  const handleSave = () => {
    updateAiSettings({
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      chatModel: chatModel.trim(),
      visionModel: visionModel.trim(),
      transcriptionModel: transcriptionModel.trim()
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OpenAI-Compatible AI Provider Setup"
      subtitle="Configure model endpoints for Lecture Transcriptions, Question Writing, and the Doubt Desk."
      maxWidth="md"
    >
      <div className="flex flex-col gap-4">
        <div className="border border-border dark:border-border-dark bg-surface-raised dark:bg-surface-raised-dark p-3 rounded text-xs text-content-secondary dark:text-content-secondary-dark flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
          <span>
            <strong>Zero Server Transmission:</strong> API keys are held strictly in this device's browser local memory and never transmitted to any external server.
          </span>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-content-secondary dark:text-content-secondary-dark">
              API Key (Masked)
            </span>
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="text-xs text-[#e11d48] dark:text-[#fb7185] hover:underline"
            >
              {showKey ? 'Hide key' : 'Reveal key'}
            </button>
          </div>
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-proj-..."
            className="w-full px-3 py-1.5 text-sm font-mono rounded-md bg-white dark:bg-surface-dark border border-border dark:border-border-dark text-content-primary dark:text-content-primary-dark focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
        </div>

        <Field
          label="Base URL"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          helper="Works with OpenAI, Groq, Ollama, OpenRouter, or local vLLM gateways."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field
            label="Chat / Reasoning Model"
            value={chatModel}
            onChange={(e) => setChatModel(e.target.value)}
            placeholder="gpt-4o"
          />
          <Field
            label="Vision Model"
            value={visionModel}
            onChange={(e) => setVisionModel(e.target.value)}
            placeholder="gpt-4o"
          />
        </div>

        <Field
          label="Audio Transcription Model"
          value={transcriptionModel}
          onChange={(e) => setTranscriptionModel(e.target.value)}
          placeholder="whisper-1"
        />

        <div className="flex justify-end gap-2 pt-3 border-t border-border dark:border-border-dark mt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleSave} icon={<KeyRound size={14} />}>
            Save Provider Credentials
          </Button>
        </div>
      </div>
    </Modal>
  );
};
