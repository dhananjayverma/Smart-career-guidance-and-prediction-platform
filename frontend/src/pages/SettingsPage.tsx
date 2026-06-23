import { useEffect, useState } from 'react';
import {
  User,
  Globe,
  Bell,
  Shield,
  ChevronRight,
  Check,
  SlidersHorizontal,
} from 'lucide-react';
import type { ElementType } from 'react';
import { getSettings } from '../lib/api';

type SettingsSection = 'profile' | 'language' | 'notifications';

interface SettingsData {
  tabs: { id: SettingsSection; label: string; icon: string }[];
  educationLevels: string[];
  interests: string[];
  languages: { id: string; label: string; desc: string }[];
  notifications: { label: string; desc: string }[];
  helpLinks: { label: string; icon: string }[];
}

const iconMap: Record<string, ElementType> = {
  Bell,
  Globe,
  Shield,
  User,
};

export default function SettingsPage() {
  const [language, setLanguage] = useState('hinglish');
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [settings, setSettings] = useState<SettingsData | null>(null);

  useEffect(() => {
    getSettings<SettingsData>()
      .then(setSettings)
      .catch((error) => console.warn('Settings API unavailable:', error));
  }, []);

  return (
    <div className="space-y-6">
      <div className="page-hero">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-950">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">Settings</h1>
            <p className="text-sm text-slate-300">Profile, language, and notifications.</p>
          </div>
        </div>
      </div>

      <div className="surface overflow-hidden">
        <div className="flex">
          {settings?.tabs.map((tab) => {
            const Icon = iconMap[tab.icon] || User;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-bold transition ${
                  activeSection === tab.id
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Section */}
      {activeSection === 'profile' && (
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="section-title">Basic Information</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Your Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                className="input-field"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Education Level</label>
              <select className="input-field">
                <option>Select education level</option>
                {settings?.educationLevels.map((level) => (
                  <option key={level}>{level}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Career Interests</label>
              <div className="flex flex-wrap gap-2">
                {settings?.interests.map((interest) => (
                  <button
                    key={interest}
                    className="pill"
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Language Section */}
      {activeSection === 'language' && (
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="section-title">Language Preference</p>
          </div>
          <div className="p-4 space-y-2">
            {settings?.languages.map((lang) => (
              <button
                key={lang.id}
                onClick={() => setLanguage(lang.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  language === lang.id ? 'border-slate-950 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{lang.label}</p>
                    <p className="text-xs text-slate-500">{lang.desc}</p>
                  </div>
                  {language === lang.id && (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="surface overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
            <p className="section-title">Notification Preferences</p>
          </div>
          <div className="divide-y divide-slate-200">
            {settings?.notifications.map((item) => (
              <div key={item.label} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-950">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <div className="relative h-5 w-10 rounded-full bg-slate-950">
                  <div className="absolute right-0.5 top-0.5 h-4 w-4 rounded-full bg-white" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="surface overflow-hidden">
        <div className="divide-y divide-slate-200">
          {settings?.helpLinks.map((item) => {
            const Icon = iconMap[item.icon] || Shield;
            return (
              <button
                key={item.label}
                className="flex w-full items-center justify-between p-4 hover:bg-slate-50"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-center text-xs font-medium text-slate-400">NextStep AI v1.0.0</div>
    </div>
  );
}
