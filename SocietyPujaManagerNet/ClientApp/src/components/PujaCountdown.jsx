import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Chip, Button, useTheme } from '@mui/material';
import {
  Celebration as CelebrationIcon,
  Event as EventIcon,
  Fastfood as FoodIcon,
  EmojiEvents as CulturalIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getPujaStartDate, formatDate } from '../utils/dateUtils';
import { brand, gradient } from '../theme/colorTokens';

const parseTargetDate = (dateStr) => {
  if (!dateStr) return null;
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

const PujaCountdown = ({ config, compact = false, onNavigateTab }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();

  const startDateStr = useMemo(() => getPujaStartDate(config), [config]);

  const [timeLeft, setTimeLeft] = useState(() => {
    const target = parseTargetDate(startDateStr);
    if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: false };
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true };
    const totalSeconds = Math.max(0, Math.floor(diff / 1000));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
      isCompleted: false,
    };
  });

  useEffect(() => {
    const updateCountdown = () => {
      const target = parseTargetDate(startDateStr);
      if (!target) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: false });
        return;
      }
      const now = new Date();
      const diff = target.getTime() - now.getTime();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isCompleted: true });
        return;
      }
      const totalSeconds = Math.max(0, Math.floor(diff / 1000));
      setTimeLeft({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
        isCompleted: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [startDateStr]);

  const handleNavigate = (path, tabIndex) => {
    if (onNavigateTab && tabIndex !== undefined) {
      onNavigateTab(tabIndex);
    } else {
      navigate(path);
    }
  };

  const DigitCard = ({ value, label }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: { xs: 62, sm: 78, md: 92 },
        height: { xs: 68, sm: 78, md: 88 },
        px: { xs: 1, sm: 1.5 },
        py: { xs: 0.5, sm: 1 },
        borderRadius: { xs: '12px', sm: '16px' },
        background: isDark
          ? 'linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #FFFDF7 100%)',
        border: isDark
          ? '1px solid rgba(255, 179, 0, 0.28)'
          : '1px solid rgba(255, 143, 0, 0.3)',
        boxShadow: isDark
          ? '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          : '0 4px 16px rgba(255, 143, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: isDark
            ? '0 6px 20px rgba(255, 179, 0, 0.25)'
            : '0 6px 20px rgba(255, 143, 0, 0.22)',
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: gradient.brandHorizontal,
          borderRadius: '16px 16px 0 0',
        },
      }}
    >
      <Typography
        sx={{
          fontWeight: 900,
          fontSize: { xs: '1.65rem', sm: '2.2rem', md: '2.5rem' },
          lineHeight: 1.05,
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.02em',
          background: isDark
            ? 'linear-gradient(180deg, #FFF8E1 0%, #FFD54F 50%, #FFB300 100%)'
            : 'linear-gradient(180deg, #E65100 0%, #FF8F00 100%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {String(Math.max(0, value)).padStart(2, '0')}
      </Typography>
      <Typography
        variant="caption"
        sx={{
          fontSize: { xs: '0.6rem', sm: '0.68rem', md: '0.72rem' },
          fontWeight: 800,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.6)',
          mt: 0.2,
        }}
      >
        {label}
      </Typography>
    </Box>
  );

  const ColonSeparator = () => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: { xs: 0.6, sm: 0.8 },
        px: { xs: 0.2, sm: 0.5 },
        animation: 'pulseColon 1.2s ease-in-out infinite',
        '@keyframes pulseColon': {
          '0%, 100%': { opacity: 0.9, transform: 'scale(1)' },
          '50%': { opacity: 0.25, transform: 'scale(0.85)' },
        },
      }}
    >
      <Box
        sx={{
          width: { xs: 4, sm: 5 },
          height: { xs: 4, sm: 5 },
          borderRadius: '50%',
          backgroundColor: brand.orange,
          boxShadow: `0 0 8px ${brand.orange}`,
        }}
      />
      <Box
        sx={{
          width: { xs: 4, sm: 5 },
          height: { xs: 4, sm: 5 },
          borderRadius: '50%',
          backgroundColor: brand.orange,
          boxShadow: `0 0 8px ${brand.orange}`,
        }}
      />
    </Box>
  );

  // Admin controlled toggle: if disabled in Settings, do not display
  if (config?.showPujaCountdown === false) {
    return null;
  }

  const pujaName = config?.pujaName?.trim() || 'Durga Puja';

  const festival = (() => {
    const lower = pujaName.toLowerCase();
    if (lower.includes('durga')) {
      return {
        key: 'durga',
        title: '🌺 শুভ শারদীয়া • Shubho Sharodiya! 🌺',
        desc: 'Maa Durga has arrived with her divine blessings! Wishing everyone joy, peace, good health, and grand festivities.',
        chant: '🙏 বলো দুর্গা মাই কি জয় • Bolo Durga Mai Ki Jai! 🙏',
        image: '/MaaLogo.png',
        badge: '🎉 DURGA PUJA IS LIVE • FESTIVAL HAS BEGUN! 🎉',
        headerIconType: 'image',
        headerImage: '/durga_icon.png',
        button1Label: 'Bhog & Food Schedule',
        button1Path: '/my-food',
        button1Tab: 1,
        button2Label: 'Cultural Programs',
        button2Path: '/events',
        button2Tab: 3,
        glowColor: 'rgba(255, 179, 0, 0.6)',
        bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(255, 143, 0, 0.22) 0%, rgba(216, 27, 96, 0.12) 50%, rgba(17, 24, 39, 0.95) 100%)',
        bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(255, 238, 204, 0.95) 0%, rgba(255, 224, 178, 0.8) 50%, #FFFFFF 100%)',
        borderColorDark: '2px solid rgba(255, 179, 0, 0.45)',
        borderColorLight: '2px solid rgba(255, 143, 0, 0.4)',
        countdownSubtitle: '✨ The grand festival of Durga Puja is arriving! Let the celebrations begin 🙏',
      };
    }
    if (lower.includes('lakshmi') || lower.includes('laxmi')) {
      return {
        key: 'lakshmi',
        title: '🌾 শুভ কোজাগরী লক্ষ্মী পূজা • Happy Lakshmi Puja! 🌾',
        desc: 'May Maa Lakshmi shower divine blessings, eternal abundance, peace, and prosperity on every household and family.',
        chant: '🙏 এসো মা লক্ষ্মী বসো ঘরে • Joy Maa Lakshmi! 🙏',
        image: '/durga_icon.png',
        badge: '🌾 LAKSHMI PUJA IS LIVE • BLESSINGS OF ABUNDANCE! 🌾',
        headerIconType: 'emoji',
        headerEmoji: '🌾',
        button1Label: 'Prasad & Food Schedule',
        button1Path: '/my-food',
        button1Tab: 1,
        button2Label: 'Puja Details & Events',
        button2Path: '/events',
        button2Tab: 3,
        glowColor: 'rgba(255, 215, 0, 0.65)',
        bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(255, 215, 0, 0.22) 0%, rgba(255, 143, 0, 0.12) 50%, rgba(17, 24, 39, 0.95) 100%)',
        bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(255, 250, 205, 0.95) 0%, rgba(255, 239, 179, 0.8) 50%, #FFFFFF 100%)',
        borderColorDark: '2px solid rgba(255, 215, 0, 0.5)',
        borderColorLight: '2px solid rgba(255, 179, 0, 0.45)',
        countdownSubtitle: '🌾 The auspicious Kojagari Lakshmi Puja is approaching! Welcome happiness and prosperity 🙏',
      };
    }
    if (lower.includes('kali')) {
      return {
        key: 'kali',
        title: '🪔 শুভ দীপাবলি ও শুভ শ্যামাপূজা • Happy Kali Puja! 🪔',
        desc: 'Maa Kali has arrived with her divine strength and protective grace. May her blessings destroy all evils and bring light, victory, and good health.',
        chant: '🙏 জয় মা কালী • Joy Maa Kali! 🙏',
        image: '/durga_icon.png',
        badge: '🪔 KALI PUJA IS LIVE • TRIUMPH OF LIGHT! 🪔',
        headerIconType: 'emoji',
        headerEmoji: '🪔',
        button1Label: 'Bhog & Food Schedule',
        button1Path: '/my-food',
        button1Tab: 1,
        button2Label: 'Diya & Cultural Events',
        button2Path: '/events',
        button2Tab: 3,
        glowColor: 'rgba(230, 81, 0, 0.65)',
        bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(230, 81, 0, 0.25) 0%, rgba(183, 28, 28, 0.15) 50%, rgba(17, 24, 39, 0.95) 100%)',
        bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(255, 224, 178, 0.95) 0%, rgba(255, 204, 188, 0.8) 50%, #FFFFFF 100%)',
        borderColorDark: '2px solid rgba(255, 112, 67, 0.5)',
        borderColorLight: '2px solid rgba(230, 81, 0, 0.45)',
        countdownSubtitle: '🪔 The festival of lights and Shyama Puja is near! Triumph of light over darkness ✨',
      };
    }
    if (lower.includes('saraswati')) {
      return {
        key: 'saraswati',
        title: '🌸 শুভ বসন্ত পঞ্চমী ও সরস্বতী পূজা • Happy Saraswati Puja! 🌸',
        desc: 'May Maa Saraswati, the goddess of knowledge and arts, illuminate our minds with wisdom, intellect, learning, and inner peace.',
        chant: '🙏 জয় মা সরস্বতী • Joy Maa Saraswati! 🙏',
        image: '/durga_icon.png',
        badge: '🌸 SARASWATI PUJA IS LIVE • FESTIVAL OF WISDOM! 🌸',
        headerIconType: 'emoji',
        headerEmoji: '🌸',
        button1Label: 'Prasad & Food Schedule',
        button1Path: '/my-food',
        button1Tab: 1,
        button2Label: 'Student & Cultural Programs',
        button2Path: '/events',
        button2Tab: 3,
        glowColor: 'rgba(255, 235, 59, 0.65)',
        bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(255, 214, 0, 0.22) 0%, rgba(255, 171, 0, 0.12) 50%, rgba(17, 24, 39, 0.95) 100%)',
        bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(255, 253, 231, 0.95) 0%, rgba(255, 249, 196, 0.8) 50%, #FFFFFF 100%)',
        borderColorDark: '2px solid rgba(255, 214, 0, 0.5)',
        borderColorLight: '2px solid rgba(255, 193, 7, 0.45)',
        countdownSubtitle: '🌸 The sacred Vasant Panchami & Saraswati Puja is coming! Celebrate wisdom and the arts 📚',
      };
    }
    if (lower.includes('gala')) {
      return {
        key: 'gala',
        title: '🎭 Grand Gala Night Celebrations! ✨',
        desc: 'The spectacular Gala Night celebrations have arrived! Join us for a dazzling evening filled with captivating performances, music, dance, fun, and delicious dining.',
        chant: '🎶 Let the Music, Joy & Festivities Begin! 🌟',
        image: null,
        badge: '✨ GALA NIGHT IS LIVE • CELEBRATIONS UNDERWAY! ✨',
        headerIconType: 'icon',
        button1Label: 'Food & Refreshments',
        button1Path: '/my-food',
        button1Tab: 1,
        button2Label: 'Cultural Programs & Lineup',
        button2Path: '/events',
        button2Tab: 3,
        glowColor: 'rgba(156, 39, 176, 0.65)',
        bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(156, 39, 176, 0.25) 0%, rgba(255, 143, 0, 0.15) 50%, rgba(17, 24, 39, 0.95) 100%)',
        bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(243, 229, 245, 0.95) 0%, rgba(255, 236, 179, 0.8) 50%, #FFFFFF 100%)',
        borderColorDark: '2px solid rgba(186, 104, 200, 0.5)',
        borderColorLight: '2px solid rgba(156, 39, 176, 0.4)',
        countdownSubtitle: '🌟 Get ready for spectacular Gala Night performances, music, dance, and delicious dining! 🎶',
      };
    }
    return {
      key: 'general',
      title: `🎉 শুভ ${pujaName} • Happy ${pujaName}! 🎉`,
      desc: `The auspicious celebration of ${pujaName} is underway! Wishing all residents and families boundless joy, health, and togetherness.`,
      chant: `✨ Warm Wishes for a Wonderful ${pujaName}! ✨`,
      image: '/durga_icon.png',
      badge: `🎉 ${pujaName.toUpperCase()} IS LIVE! 🎉`,
      headerIconType: 'image',
      headerImage: '/durga_icon.png',
      button1Label: 'Bhog & Food Schedule',
      button1Path: '/my-food',
      button1Tab: 1,
      button2Label: 'Cultural Programs',
      button2Path: '/events',
      button2Tab: 3,
      glowColor: 'rgba(255, 179, 0, 0.6)',
      bgDark: 'radial-gradient(ellipse at 50% 20%, rgba(255, 143, 0, 0.22) 0%, rgba(216, 27, 96, 0.12) 50%, rgba(17, 24, 39, 0.95) 100%)',
      bgLight: 'radial-gradient(ellipse at 50% 20%, rgba(255, 238, 204, 0.95) 0%, rgba(255, 224, 178, 0.8) 50%, #FFFFFF 100%)',
      borderColorDark: '2px solid rgba(255, 179, 0, 0.45)',
      borderColorLight: '2px solid rgba(255, 143, 0, 0.4)',
      countdownSubtitle: `✨ The grand festival of ${pujaName} is arriving! Let the celebrations begin 🙏`,
    };
  })();

  return (
    <Box sx={{ width: '100%', position: 'relative', zIndex: 1 }}>
      {timeLeft.isCompleted ? (
        /* Celebration Message State */
        <Box
          sx={{
            position: 'relative',
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '20px',
            background: isDark ? festival.bgDark : festival.bgLight,
            border: isDark ? festival.borderColorDark : festival.borderColorLight,
            boxShadow: isDark
              ? `0 8px 32px ${festival.glowColor}, inset 0 1px 0 rgba(255, 255, 255, 0.15)`
              : `0 8px 30px rgba(255, 143, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.9)`,
            textAlign: 'center',
            overflow: 'hidden',
            my: compact ? 1.5 : 2.5,
          }}
        >
          {/* Festival Emblem with glowing ring */}
          <Box
            sx={{
              width: { xs: 60, sm: 72 },
              height: { xs: 60, sm: 72 },
              borderRadius: '50%',
              mx: 'auto',
              mb: 1.5,
              p: 0.5,
              background: festival.key === 'gala'
                ? 'linear-gradient(135deg, #AB47BC 0%, #7B1FA2 50%, #FF8F00 100%)'
                : 'linear-gradient(135deg, #FFB300 0%, #FF8F00 50%, #E65100 100%)',
              boxShadow: `0 0 24px ${festival.glowColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'celebrateGlow 2.5s ease-in-out infinite',
              '@keyframes celebrateGlow': {
                '0%, 100%': { transform: 'scale(1)', boxShadow: `0 0 20px ${festival.glowColor}` },
                '50%': { transform: 'scale(1.05)', boxShadow: `0 0 35px ${festival.glowColor}` },
              },
            }}
          >
            {festival.key === 'gala' ? (
              <CulturalIcon sx={{ fontSize: { xs: 34, sm: 40 }, color: '#fff' }} />
            ) : (
              <Box
                component="img"
                src={festival.image || '/durga_icon.png'}
                alt={pujaName}
                onError={(e) => { e.currentTarget.src = '/durga_icon.png'; }}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', backgroundColor: '#fff' }}
              />
            )}
          </Box>

          <Chip
            icon={<CelebrationIcon sx={{ fontSize: '18px !important', color: '#fff !important' }} />}
            label={festival.badge}
            sx={{
              background: festival.key === 'gala'
                ? 'linear-gradient(135deg, #8E24AA 0%, #5E35B1 100%)'
                : 'linear-gradient(135deg, #FF6F00 0%, #E65100 100%)',
              color: '#fff',
              fontWeight: 800,
              fontSize: { xs: '0.72rem', sm: '0.82rem' },
              letterSpacing: '0.08em',
              height: 28,
              mb: 1.5,
              boxShadow: '0 2px 10px rgba(230, 81, 0, 0.35)',
            }}
          />

          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.2rem' },
              background: gradient.brandTextFull,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.8,
            }}
          >
            {festival.title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              fontWeight: 600,
              fontSize: { xs: '0.9rem', sm: '1.05rem' },
              maxWidth: 600,
              mx: 'auto',
              mb: 1,
              lineHeight: 1.5,
            }}
          >
            {festival.desc}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              color: festival.key === 'gala' ? '#BA68C8' : brand.orange,
              fontWeight: 800,
              fontSize: { xs: '0.8rem', sm: '0.9rem' },
              letterSpacing: '0.08em',
              mb: 2.5,
            }}
          >
            {festival.chant}
          </Typography>

          {/* Quick Action Navigation Buttons */}
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<FoodIcon />}
              onClick={() => handleNavigate(festival.button1Path, festival.button1Tab)}
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 0.8,
                fontSize: '0.82rem',
                fontWeight: 700,
                background: festival.key === 'gala'
                  ? 'linear-gradient(135deg, #8E24AA 0%, #D81B60 100%)'
                  : 'linear-gradient(135deg, #FF8F00 0%, #E65100 100%)',
              }}
            >
              {festival.button1Label}
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CulturalIcon />}
              onClick={() => handleNavigate(festival.button2Path, festival.button2Tab)}
              sx={{
                borderRadius: '12px',
                px: 2,
                py: 0.8,
                fontSize: '0.82rem',
                fontWeight: 700,
                color: festival.key === 'gala' ? '#BA68C8' : brand.orange,
                borderColor: festival.key === 'gala' ? 'rgba(186, 104, 200, 0.4)' : 'rgba(255, 143, 0, 0.4)',
              }}
            >
              {festival.button2Label}
            </Button>
          </Box>
        </Box>
      ) : (
        /* Active Countdown State */
        <Box
          sx={{
            position: 'relative',
            py: compact ? { xs: 1.5, sm: 2 } : { xs: 2.5, sm: 3 },
            px: { xs: 1.5, sm: 3 },
            borderRadius: '20px',
            background: isDark
              ? 'linear-gradient(135deg, rgba(255, 143, 0, 0.08) 0%, rgba(206, 147, 216, 0.04) 50%, rgba(255, 179, 0, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255, 248, 240, 0.95) 0%, rgba(255, 243, 224, 0.8) 100%)',
            border: isDark ? '1px solid rgba(255, 179, 0, 0.28)' : '1px solid rgba(255, 143, 0, 0.35)',
            boxShadow: isDark
              ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 8px 30px rgba(255, 143, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(16px)',
            textAlign: 'center',
            mb: compact ? 2 : 3,
            mt: compact ? 0.5 : 1,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: { xs: 1.5, sm: 2 },
              flexWrap: 'wrap',
            }}
          >
            {festival.headerIconType === 'emoji' ? (
              <Typography component="span" sx={{ fontSize: { xs: 20, sm: 24 }, lineHeight: 1 }}>
                {festival.headerEmoji}
              </Typography>
            ) : festival.headerIconType === 'icon' ? (
              <CelebrationIcon sx={{ color: brand.gold, fontSize: { xs: 22, sm: 26 } }} />
            ) : (
              <Box
                component="img"
                src="/durga_icon.png"
                alt={pujaName}
                sx={{
                  width: { xs: 22, sm: 26 },
                  height: { xs: 22, sm: 26 },
                  objectFit: 'contain',
                }}
              />
            )}
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '0.95rem', sm: '1.15rem' },
                letterSpacing: '0.04em',
                background: gradient.brandTextFull,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {pujaName} {config?.year || ''} Countdown
            </Typography>
            <Chip
              size="small"
              icon={<EventIcon sx={{ fontSize: '14px !important', color: `${brand.orange} !important` }} />}
              label={`Starts ${formatDate(startDateStr, config?.dateFormat || 'dd-MM-YYYY')}`}
              sx={{
                height: 22,
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: isDark ? 'rgba(255, 143, 0, 0.12)' : 'rgba(255, 143, 0, 0.1)',
                color: isDark ? brand.gold : brand.orangeDark,
                border: '1px solid rgba(255, 143, 0, 0.25)',
              }}
            />
          </Box>

          {/* 4 Digit Cards with Glowing Colons */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: { xs: 0.5, sm: 1.2, md: 1.8 },
              mx: 'auto',
            }}
          >
            <DigitCard value={timeLeft.days} label="Days" />
            <ColonSeparator />
            <DigitCard value={timeLeft.hours} label="Hours" />
            <ColonSeparator />
            <DigitCard value={timeLeft.minutes} label="Minutes" />
            <ColonSeparator />
            <DigitCard value={timeLeft.seconds} label="Seconds" />
          </Box>

          {/* Footer subtitle */}
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              mt: { xs: 1.5, sm: 2 },
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.82rem' },
              letterSpacing: '0.02em',
            }}
          >
            {festival.countdownSubtitle}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PujaCountdown;
