import React from 'react';

export const formatMenuText = (text) => {
  if (!text) return null;
  // Handle literal "\n" strings that might be saved from JSON inputs as well as actual newlines
  const normalizedText = text.replace(/\\n/g, '\n');
  const lines = normalizedText.split('\n');
  
  return lines.map((line, i) => {
    // Basic bold parsing: **text**
    const parts = line.split(/(\*\*.*?\*\*)/g);
    return (
      <React.Fragment key={`line-${i}`}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={`bold-${i}-${j}`}>{part.slice(2, -2)}</strong>;
          }
          return <React.Fragment key={`text-${i}-${j}`}>{part}</React.Fragment>;
        })}
        {i < lines.length - 1 && <br key={`br-${i}`} />}
      </React.Fragment>
    );
  });
};

export const formatMenuTextHTML = (text) => {
  if (!text) return '';
  const normalizedText = text.replace(/\\n/g, '\n');
  return normalizedText
    .replace(/\n/g, '<br/>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

export const getMealDisplayName = (dayName, mealType) => {
  if (dayName === 'Ashtami' && mealType === 'Dinner') {
    return 'Hi Tea + Dinner';
  }
  return mealType;
};
