import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import { getActiveBannerAds, SLOT_DIMENSIONS } from '../services/bannerAdService';
import { overlay, border, text } from '../theme/colorTokens';

/**
 * BannerSlot — renders active banners for a given slot.
 * If multiple banners exist, rotates them based on each banner's displayDurationSec.
 * Renders nothing if no active banners exist (zero layout impact).
 * Banners stretch to full container width and maintain aspect ratio.
 */
const BannerSlot = ({ slot }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  // Fetch active banners for this slot
  const loadBanners = useCallback(async () => {
    try {
      const active = await getActiveBannerAds(slot);
      if (mountedRef.current) {
        setBanners(active);
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error(`BannerSlot[${slot}] load error:`, err);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [slot]);

  useEffect(() => {
    mountedRef.current = true;
    loadBanners();

    // Refresh banners every 5 minutes to catch new ads or expired ones
    const refreshInterval = setInterval(loadBanners, 5 * 60 * 1000);

    return () => {
      mountedRef.current = false;
      clearInterval(refreshInterval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [loadBanners]);

  // Rotation logic — each banner rotates after its own displayDurationSec
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (banners.length <= 1) return;

    const currentBanner = banners[currentIndex];
    const durationMs = ((currentBanner?.displayDurationSec) || 5) * 1000;

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, durationMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [banners, currentIndex]);

  // Don't render anything if no banners (zero layout impact)
  if (!loading && banners.length === 0) return null;

  const dims = SLOT_DIMENSIONS[slot] || { width: 728, height: 90 };
  const desktopAspectRatio = `${dims.width} / ${dims.height}`;
  
  // Slightly taller on mobile for legibility, but without becoming excessively tall
  const responsiveAspectRatio = { 
    xs: '3 / 1', 
    sm: '3.5 / 1', 
    md: desktopAspectRatio 
  };

  const currentBanner = banners[currentIndex];

  const isTopSlot = slot === 'hero-top' || slot === 'header';
  const isBottomSlot = slot === 'hero-bottom' || slot === 'footer';

  // Loading skeleton — full width, aspect-ratio based height
  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          mt: isTopSlot ? 0 : { xs: 0.5, sm: 1 },
          mb: isBottomSlot ? 0 : { xs: 0.5, sm: 1 },
        }}
      >
        <Skeleton
          variant="rounded"
          width="100%"
          sx={{
            borderRadius: '12px',
            backgroundColor: overlay.whiteMedium,
            aspectRatio: responsiveAspectRatio,
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        mt: isTopSlot ? 0 : { xs: 0.5, sm: 1 },
        mb: isBottomSlot ? 0 : { xs: 0.5, sm: 1 },
        position: 'relative',
        aspectRatio: responsiveAspectRatio,
        borderRadius: '12px',
        overflow: 'hidden',
        background: overlay.whiteLight,
        border: `1px solid ${overlay.whiteStrong}`,
        transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        '&:hover': currentBanner?.linkUrl ? {
          borderColor: border.brandSubtle(true),
          boxShadow: `0 2px 12px ${overlay.brandGlowXLight}`,
        } : {},
      }}
    >
      {banners.map((banner, i) => (
        <Box
          key={banner.id || i}
          component={banner?.linkUrl ? 'a' : 'div'}
          href={banner?.linkUrl || undefined}
          target={banner?.linkUrl ? '_blank' : undefined}
          rel={banner?.linkUrl ? 'noopener noreferrer sponsored' : undefined}
          onClick={banner?.linkUrl ? undefined : (e) => e.preventDefault()}
          sx={{
            display: 'block',
            position: 'absolute',
            inset: 0,
            opacity: i === currentIndex ? 1 : 0,
            visibility: i === currentIndex ? 'visible' : 'hidden',
            transition: 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out',
            zIndex: i === currentIndex ? 1 : 0,
            cursor: banner?.linkUrl ? 'pointer' : 'default',
            textDecoration: 'none',
            backgroundColor: (!banner?.imageData && !banner?.imageUrl) ? 'rgba(0,0,0,0.2)' : 'transparent',
          }}
        >
          {/* Banner image — supports both base64 (imageData) and external URL (imageUrl) */}
          {(banner?.imageData || banner?.imageUrl) && (
            <Box
              component="img"
              src={banner.imageData || banner.imageUrl}
              alt={banner.title || 'Advertisement'}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'fill',
                display: 'block',
              }}
            />
          )}

          {/* Overlay Texts (Handled conditionally if positions match) */}
          {(() => {
            const pos1 = banner.overlayPosition || 'center';
            const pos2 = banner.overlaySubTextPosition || 'center';
            const samePos = pos1 === pos2;

            const PrimaryText = banner?.overlayText && (
              <Typography
                sx={{
                  backgroundColor: banner.overlayBgColor || 'transparent',
                  px: banner.overlayBgColor ? 2 : 0,
                  py: banner.overlayBgColor ? 1 : 0,
                  borderRadius: '8px',
                  maxWidth: samePos ? '100%' : '80%',
                  textAlign: getOverlayTextAlign(pos1),
                  color: banner.overlayColor || text.white,
                  fontSize: getOverlayFontSize(banner.overlayFontSize),
                  fontWeight: banner.overlayFontWeight || '800',
                  fontFamily: banner.overlayFontFamily || 'inherit',
                  textShadow: banner.overlayHasShadow !== false ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  lineHeight: 1.3,
                  whiteSpace: 'pre-line',
                }}
              >
                {banner.overlayText}
              </Typography>
            );

            const SecondaryText = banner?.overlaySubText && (
              <Typography
                sx={{
                  backgroundColor: banner.overlaySubTextBgColor || 'transparent',
                  px: banner.overlaySubTextBgColor ? 2 : 0,
                  py: banner.overlaySubTextBgColor ? 1 : 0,
                  borderRadius: '8px',
                  maxWidth: samePos ? '100%' : '80%',
                  textAlign: getOverlayTextAlign(pos2),
                  color: banner.overlaySubTextColor || text.white,
                  fontSize: getSubTextFontSize(banner.overlaySubTextFontSize || 'medium'),
                  fontWeight: banner.overlaySubTextFontWeight || '500',
                  fontFamily: banner.overlaySubTextFontFamily || 'inherit',
                  textShadow: banner.overlaySubTextHasShadow !== false ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                  lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}
              >
                {banner.overlaySubText}
              </Typography>
            );

            if (samePos && (banner?.overlayText || banner?.overlaySubText)) {
              let alignFlex = 'center';
              if (pos1.endsWith('left')) alignFlex = 'flex-start';
              if (pos1.endsWith('right')) alignFlex = 'flex-end';

              return (
                <Box
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: getOverlayAlign(pos1),
                    justifyContent: getOverlayJustify(pos1),
                    p: { xs: 1.5, sm: 2.5 },
                    pointerEvents: 'none',
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: alignFlex, maxWidth: '80%' }}>
                    {PrimaryText}
                    {SecondaryText}
                  </Box>
                </Box>
              );
            }

            return (
              <>
                {banner?.overlayText && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: getOverlayAlign(pos1),
                      justifyContent: getOverlayJustify(pos1),
                      p: { xs: 1.5, sm: 2.5 },
                      pointerEvents: 'none',
                    }}
                  >
                    {PrimaryText}
                  </Box>
                )}
                {banner?.overlaySubText && (
                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: getOverlayAlign(pos2),
                      justifyContent: getOverlayJustify(pos2),
                      p: { xs: 1.5, sm: 2.5 },
                      pointerEvents: 'none',
                    }}
                  >
                    {SecondaryText}
                  </Box>
                )}
              </>
            );
          })()}
        </Box>
      ))}

      {/* Subtle "Ad" indicator */}
      <Typography
        sx={{
          position: 'absolute',
          top: 4,
          right: 6,
          fontSize: '0.55rem',
          fontWeight: 700,
          color: overlay.whiteXBold,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          lineHeight: 1,
          px: 0.5,
          py: 0.2,
          borderRadius: '3px',
          backgroundColor: overlay.shadowBlack,
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 10,
        }}
      >
        Ad
      </Typography>

      {/* Rotation indicator dots (only when multiple banners) */}
      {banners.length > 1 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          {banners.map((_, i) => (
            <Box
              key={`dot-${i}`}
              sx={{
                width: i === currentIndex ? 12 : 5,
                height: 3,
                borderRadius: '2px',
                backgroundColor: i === currentIndex
                  ? overlay.brandDot
                  : overlay.brandDotInactive,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

// --- Overlay positioning helpers ---

const getOverlayAlign = (pos) => {
  if (!pos) return 'center';
  if (pos.startsWith('top')) return 'flex-start';
  if (pos.startsWith('bottom')) return 'flex-end';
  return 'center';
};

const getOverlayJustify = (pos) => {
  if (!pos) return 'center';
  if (pos.endsWith('left')) return 'flex-start';
  if (pos.endsWith('right')) return 'flex-end';
  return 'center';
};

const getOverlayTextAlign = (pos) => {
  if (!pos) return 'center';
  if (pos.endsWith('left')) return 'left';
  if (pos.endsWith('right')) return 'right';
  return 'center';
};

const getOverlayFontSize = (size) => {
  switch (size) {
    case 'small': return { xs: '0.75rem', sm: '0.9rem' };
    case 'large': return { xs: '1.2rem', sm: '1.8rem' };
    case 'xl': return { xs: '1.5rem', sm: '2.4rem' };
    case 'medium':
    default: return { xs: '0.95rem', sm: '1.3rem' };
  }
};

const getSubTextFontSize = (size) => {
  switch (size) {
    case 'small': return { xs: '0.65rem', sm: '0.75rem' };
    case 'large': return { xs: '1rem', sm: '1.4rem' };
    case 'xl': return { xs: '1.2rem', sm: '1.8rem' };
    case 'medium':
    default: return { xs: '0.8rem', sm: '1.05rem' };
  }
};

export default BannerSlot;

