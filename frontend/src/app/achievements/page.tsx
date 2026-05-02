'use client';

import { useState } from 'react';

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  category: string;
  unlocked: boolean;
  dateUnlocked?: string;
}

const Achievements = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const achievementsData: Achievement[] = [
    {
      id: 1,
      title: "First Steps",
      description: "Complete your first project",
      icon: "🎯",
      category: "projects",
      unlocked: true,
      dateUnlocked: "2023-05-15"
    },
    {
      id: 2,
      title: "Bug Hunter",
      description: "Fix 10 bugs in a single day",
      icon: "🐛",
      category: "development",
      unlocked: true,
      dateUnlocked: "2023-06-22"
    },
    {
      id: 3,
      title: "Team Player",
      description: "Collaborate on 5 projects with others",
      icon: "👥",
      category: "collaboration",
      unlocked: false
    },
    {
      id: 4,
      title: "Code Master",
      description: "Write 1000 lines of clean code",
      icon: "💻",
      category: "development",
      unlocked: true,
      dateUnlocked: "2023-07-10"
    },
    {
      id: 5,
      title: "Project Manager",
      description: "Successfully lead a team to completion",
      icon: "📊",
      category: "leadership",
      unlocked: false
    },
    {
      id: 6,
      title: "Innovator",
      description: "Propose and implement 3 new features",
      icon: "💡",
      category: "innovation",
      unlocked: true,
      dateUnlocked: "2023-08-05"
    },
    {
      id: 7,
      title: "Quality Assurer",
      description: "Achieve 99% test coverage",
      icon: "✅",
      category: "quality",
      unlocked: false
    },
    {
      id: 8,
      title: "Mentor",
      description: "Guide 3 junior developers",
      icon: "👨‍🏫",
      category: "leadership",
      unlocked: true,
      dateUnlocked: "2023-09-12"
    }
  ];

  const categories = ['all', 'projects', 'development', 'collaboration', 'leadership', 'innovation', 'quality'];
  
  const filteredAchievements = selectedCategory === 'all' 
    ? achievementsData 
    : achievementsData.filter(achievement => achievement.category === selectedCategory);

  const handleAchievementClick = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
  };

  const closeModal = () => {
    setSelectedAchievement(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Achievements</h1>
          <p className="text-gray-400">Track your progress and accomplishments</p>
        </header>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAchievements.map(achievement => (
            <div
              key={achievement.id}
              onClick={() => handleAchievementClick(achievement)}
              className={`rounded-xl p-6 cursor-pointer transition-all transform hover:scale-105 hover:shadow-lg ${
                achievement.unlocked
                  ? 'bg-gray-800 border border-gray-700 hover:border-indigo-500'
                  : 'bg-gray-800/50 border border-gray-700/50 opacity-70'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-4xl mb-4">{achievement.icon}</div>
                <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>
                <p className="text-gray-400 text-sm mb-3">{achievement.description}</p>
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs px-2 py-1 rounded ${
                    achievement.unlocked 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-gray-700 text-gray-400'
                  }`}>
                    {achievement.unlocked ? 'Unlocked' : 'Locked'}
                  </span>
                  {achievement.unlocked && achievement.dateUnlocked && (
                    <span className="text-xs text-gray-500">
                      {new Date(achievement.dateUnlocked).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedAchievement && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-700">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{selectedAchievement.title}</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="flex flex-col items-center mb-6">
              <div className="text-6xl mb-4">{selectedAchievement.icon}</div>
              <p className="text-gray-300 text-center mb-4">{selectedAchievement.description}</p>
              
              <div className="flex items-center justify-between w-full mb-4">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  selectedAchievement.unlocked 
                    ? 'bg-green-900/30 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}>
                  {selectedAchievement.unlocked ? 'Unlocked' : 'Locked'}
                </span>
                
                {selectedAchievement.unlocked && selectedAchievement.dateUnlocked && (
                  <span className="text-sm text-gray-400">
                    Unlocked on {new Date(selectedAchievement.dateUnlocked).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Achievements;