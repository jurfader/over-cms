import { useState, useCallback, useRef } from 'react'
import GjsEditor, { Canvas } from '@grapesjs/react'
import type { Editor } from 'grapesjs'
import grapesjs from 'grapesjs'
import grapesjsPresetWebpage from 'grapesjs-preset-webpage'
import 'grapesjs/dist/css/grapes.min.css'
import {
  Monitor, Tablet, Smartphone,
  Undo2, Redo2, Save, Globe,
  ChevronLeft,
} from 'lucide-react'
import Link from 'next/link'
import { overcmsBlocksPlugin } from './overcms-blocks-plugin'

// ─── Canvas iframe CSS ──────────────────────────────────────────────────────
// Corporate template design tokens + utility classes injected into the
// GrapesJS canvas iframe so blocks render with correct styling.

const CANVAS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

:root {
  --font-sans: 'Open Sans', system-ui, sans-serif;
  --color-bg:        #0a0a0a;
  --color-surface:   #111111;
  --color-surface-2: #171717;
  --color-border:    rgba(255, 255, 255, 0.08);
  --color-fg:        #ffffff;
  --color-muted:     rgba(255, 255, 255, 0.55);
  --color-primary:   #E040FB;
  --color-primary-h: #CC2EE0;
  --color-accent:    #7B2FE0;
  --section-y: clamp(4.5rem, 9vw, 8rem);
  --radius-sm: 0.5rem;
  --radius:    0.875rem;
  --radius-lg: 1.5rem;
}

*, *::before, *::after { box-sizing: border-box; }

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
}

body {
  font-family:      var(--font-sans);
  background-color: var(--color-bg);
  color:            var(--color-fg);
  line-height:      1.7;
  margin: 0;
  padding: 0;
}

.container {
  width:          100%;
  max-width:      1200px;
  margin-inline:  auto;
  padding-inline: clamp(1rem, 5vw, 2.5rem);
}

.section-label {
  display:        inline-flex;
  align-items:    center;
  gap:            0.5rem;
  font-size:      0.75rem;
  font-weight:    700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color:          var(--color-primary);
}

.section-label::before {
  content:       '';
  display:       block;
  width:         1.25rem;
  height:        2px;
  background:    var(--color-primary);
  border-radius: 1px;
}

.gradient-text {
  background:              linear-gradient(90deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip:         text;
}

.btn {
  display:         inline-flex;
  align-items:     center;
  gap:             0.5rem;
  padding:         0.75rem 1.75rem;
  border-radius:   999px;
  font-weight:     600;
  font-size:       0.9375rem;
  font-family:     var(--font-sans);
  cursor:          pointer;
  text-decoration: none;
  transition:      transform 0.15s, box-shadow 0.15s, background 0.15s, border-color 0.15s;
  border:          none;
}
.btn:active { transform: scale(0.97); }

.btn-primary {
  background:  var(--color-primary);
  color:       #fff;
  box-shadow:  0 4px 20px rgba(224, 64, 251, 0.3);
}
.btn-primary:hover {
  background:  var(--color-primary-h);
  box-shadow:  0 6px 28px rgba(224, 64, 251, 0.45);
  transform:   translateY(-1px);
}

.btn-outline {
  background:  transparent;
  color:       var(--color-fg);
  border:      1.5px solid rgba(255, 255, 255, 0.2);
}
.btn-outline:hover {
  border-color: rgba(255, 255, 255, 0.5);
  transform:    translateY(-1px);
}

.glass {
  background:              rgba(255, 255, 255, 0.04);
  backdrop-filter:         blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border:                  1px solid var(--color-border);
}

.reveal {
  opacity:   1;
  transform: translateY(0);
}

img { max-width: 100%; height: auto; }

/* ── GrapesJS in-canvas elements ─────────────────────────────── */

/* Drop zone placeholder */
.gjs-placeholder {
  border: 2px dashed #E040FB !important;
  background: rgba(224, 64, 251, 0.08) !important;
}
.gjs-placeholder-int {
  background: rgba(224, 64, 251, 0.12) !important;
  min-height: 40px;
}

/* Component highlighter on hover */
.gjs-highlighter {
  outline: 2px solid rgba(224, 64, 251, 0.6) !important;
  outline-offset: -1px;
}
.gjs-highlighter-sel {
  outline: 2px solid #E040FB !important;
  outline-offset: -1px;
}

/* Component badge (label shown on hover) */
.gjs-badge {
  background: #E040FB !important;
  color: #fff !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  box-shadow: 0 2px 8px rgba(224, 64, 251, 0.4) !important;
  z-index: 10 !important;
}

/* Toolbar floating above selected component */
.gjs-toolbar {
  background: #181B2C !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5) !important;
}
.gjs-toolbar-item {
  color: rgba(255,255,255,0.7) !important;
  padding: 4px 6px !important;
}
.gjs-toolbar-item:hover {
  color: #E040FB !important;
}

/* Resizer handles */
.gjs-resizer-h {
  border: 2px solid #E040FB !important;
  background: rgba(224, 64, 251, 0.15) !important;
}

/* Empty canvas hint */
body:empty::before,
body:not(:has(*))::before {
  content: 'Przeciągnij bloki z panelu po lewej';
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(255,255,255,0.25);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
}

/* Selected component border */
[data-gjs-type]:not(body) {
  outline-offset: -1px;
  transition: outline 0.15s;
}
[data-gjs-type]:not(body):hover {
  outline: 1px dashed rgba(224, 64, 251, 0.3);
}
`

// ─── Dark theme CSS overrides for GrapesJS UI ──────────────────────────────
// Overrides every GrapesJS panel, toolbar, and widget to match OverCMS dark UI.

const DARK_THEME_CSS = `
/* ── Base color classes ─────────────────────────────────────────────── */
.gjs-one-bg {
  background-color: #111421 !important;
}
.gjs-two-color {
  color: rgba(255,255,255,0.85) !important;
}
.gjs-three-bg {
  background-color: #181B2C !important;
}
.gjs-four-color,
.gjs-four-color-h:hover {
  color: #E91E8C !important;
}

/* ── Editor root ────────────────────────────────────────────────────── */
.gjs-editor {
  background-color: #0A0B14 !important;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
  border: none !important;
}

/* ── Canvas ─────────────────────────────────────────────────────────── */
.gjs-cv-canvas {
  background-color: #0A0B14 !important;
  top: 0 !important;
}

/* ── All panels ─────────────────────────────────────────────────────── */
.gjs-pn-panel {
  background-color: #111421 !important;
  border-color: rgba(255,255,255,0.06) !important;
  color: rgba(255,255,255,0.85) !important;
}

.gjs-pn-views,
.gjs-pn-views-container {
  background-color: #111421 !important;
  border-color: rgba(255,255,255,0.06) !important;
}

.gjs-pn-options,
.gjs-pn-commands,
.gjs-pn-devices-c {
  background-color: #111421 !important;
}

/* ── Panel buttons ──────────────────────────────────────────────────── */
.gjs-pn-btn {
  color: rgba(255,255,255,0.5) !important;
  border-radius: 6px !important;
  transition: all 0.15s ease !important;
}
.gjs-pn-btn:hover {
  color: rgba(255,255,255,0.9) !important;
  background-color: rgba(255,255,255,0.06) !important;
}
.gjs-pn-btn.gjs-pn-active {
  color: #E91E8C !important;
  background-color: rgba(233,30,140,0.12) !important;
  box-shadow: none !important;
}

/* ── Blocks ─────────────────────────────────────────────────────────── */
.gjs-blocks-c {
  background-color: #111421 !important;
  padding: 6px !important;
}

.gjs-block-categories {
  background-color: #111421 !important;
}

.gjs-block-category {
  background-color: transparent !important;
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}

.gjs-block-category .gjs-title {
  background-color: transparent !important;
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  padding: 8px 10px !important;
  border-bottom: none !important;
}
.gjs-block-category .gjs-title:hover {
  color: rgba(255,255,255,0.8) !important;
}

.gjs-block-category .gjs-caret-icon {
  color: rgba(255,255,255,0.3) !important;
}

.gjs-block {
  color: rgba(255,255,255,0.7) !important;
  background-color: rgba(255,255,255,0.03) !important;
  border: 1px solid rgba(255,255,255,0.06) !important;
  border-radius: 8px !important;
  padding: 8px 6px !important;
  min-height: 60px !important;
  transition: all 0.15s ease !important;
  font-size: 11px !important;
  width: 45% !important;
  margin: 4px 2.5% !important;
  justify-content: center !important;
}
.gjs-block:hover {
  border-color: rgba(233,30,140,0.35) !important;
  background-color: rgba(233,30,140,0.06) !important;
  color: rgba(255,255,255,0.95) !important;
}
.gjs-block svg {
  fill: rgba(255,255,255,0.5) !important;
}
.gjs-block:hover svg {
  fill: rgba(255,255,255,0.8) !important;
}
.gjs-block .gjs-block-label {
  color: inherit !important;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif !important;
}

/* ── Right panel (styles / traits / layers) ─────────────────────────── */
.gjs-pn-views-container {
  scrollbar-width: thin !important;
  scrollbar-color: rgba(255,255,255,0.1) transparent !important;
}

/* ── Style Manager ──────────────────────────────────────────────────── */
.gjs-sm-sector {
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  background-color: transparent !important;
}

.gjs-sm-sector .gjs-sm-sector-title {
  background-color: transparent !important;
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  letter-spacing: 0.05em !important;
  text-transform: uppercase !important;
  border-bottom: none !important;
  padding: 8px 10px !important;
}
.gjs-sm-sector .gjs-sm-sector-title:hover {
  color: rgba(255,255,255,0.8) !important;
}

.gjs-sm-sector .gjs-sm-sector-caret {
  color: rgba(255,255,255,0.3) !important;
}

.gjs-sm-properties {
  background-color: transparent !important;
  padding: 6px 8px !important;
}

.gjs-sm-label {
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
}

.gjs-field {
  background-color: rgba(255,255,255,0.04) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 6px !important;
  color: rgba(255,255,255,0.85) !important;
  transition: border-color 0.15s ease !important;
}
.gjs-field:focus-within {
  border-color: rgba(233,30,140,0.5) !important;
}

.gjs-field input,
.gjs-field select,
.gjs-field textarea {
  color: rgba(255,255,255,0.85) !important;
  background: transparent !important;
}

.gjs-field input::placeholder {
  color: rgba(255,255,255,0.25) !important;
}

.gjs-field .gjs-input-holder {
  background: transparent !important;
}

.gjs-field-arrows {
  color: rgba(255,255,255,0.3) !important;
}
.gjs-field-arrows:hover {
  color: rgba(255,255,255,0.6) !important;
}

.gjs-d-s-arrow {
  color: rgba(255,255,255,0.3) !important;
}

.gjs-field-color-picker {
  background-color: rgba(255,255,255,0.04) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 6px !important;
}

.gjs-field-colorp-c {
  border: 1px solid rgba(255,255,255,0.12) !important;
  border-radius: 4px !important;
}

.gjs-sm-composite {
  background-color: rgba(255,255,255,0.02) !important;
  border: 1px solid rgba(255,255,255,0.04) !important;
  border-radius: 6px !important;
}

/* SM radio / button groups */
.gjs-sm-btn,
.gjs-radio-item label {
  background-color: rgba(255,255,255,0.04) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  color: rgba(255,255,255,0.5) !important;
  border-radius: 4px !important;
  transition: all 0.15s ease !important;
}
.gjs-sm-btn:hover,
.gjs-radio-item label:hover {
  background-color: rgba(255,255,255,0.08) !important;
  color: rgba(255,255,255,0.8) !important;
}
.gjs-sm-btn.gjs-sm-active,
.gjs-radio-item input:checked + label {
  background-color: rgba(233,30,140,0.15) !important;
  border-color: rgba(233,30,140,0.4) !important;
  color: #E91E8C !important;
}

.gjs-radio-items {
  background: transparent !important;
}

/* ── Trait Manager ──────────────────────────────────────────────────── */
.gjs-trt-traits {
  background-color: transparent !important;
  padding: 8px !important;
}

.gjs-trt-trait {
  padding: 4px 0 !important;
  border-bottom: 1px solid rgba(255,255,255,0.04) !important;
}
.gjs-trt-trait:last-child {
  border-bottom: none !important;
}

.gjs-label-wrp {
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
}

/* ── Layer Manager ──────────────────────────────────────────────────── */
.gjs-layers {
  background-color: transparent !important;
}

.gjs-layer {
  background-color: transparent !important;
  border-bottom: 1px solid rgba(255,255,255,0.04) !important;
}
.gjs-layer:hover {
  background-color: rgba(255,255,255,0.03) !important;
}
.gjs-layer.gjs-selected {
  background-color: rgba(233,30,140,0.08) !important;
}

.gjs-layer-title {
  background: transparent !important;
}

.gjs-layer-title-inn {
  color: rgba(255,255,255,0.7) !important;
  font-size: 12px !important;
}
.gjs-layer.gjs-selected .gjs-layer-title-inn {
  color: #E91E8C !important;
}

.gjs-layer-caret {
  color: rgba(255,255,255,0.3) !important;
}

.gjs-layer-vis {
  color: rgba(255,255,255,0.3) !important;
  border-left: 1px solid rgba(255,255,255,0.06) !important;
}
.gjs-layer-vis:hover {
  color: rgba(255,255,255,0.6) !important;
}

.gjs-layer-count {
  color: rgba(255,255,255,0.3) !important;
}

/* ── Selector Manager ───────────────────────────────────────────────── */
.gjs-clm-tags {
  background-color: #111421 !important;
  padding: 8px !important;
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}

.gjs-clm-tags .gjs-sm-title,
.gjs-clm-tags #gjs-clm-label {
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}

.gjs-clm-tags .gjs-field {
  background-color: rgba(255,255,255,0.04) !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
}

.gjs-clm-sels-info {
  color: rgba(255,255,255,0.4) !important;
}

.gjs-clm-tag {
  background-color: rgba(233,30,140,0.12) !important;
  border: 1px solid rgba(233,30,140,0.25) !important;
  border-radius: 4px !important;
  color: #E91E8C !important;
  padding: 2px 6px !important;
}

.gjs-clm-tag-close {
  color: rgba(233,30,140,0.6) !important;
}
.gjs-clm-tag-close:hover {
  color: #E91E8C !important;
}

.gjs-clm-tag-status {
  color: rgba(255,255,255,0.5) !important;
}

/* ── Toolbar (component toolbar) ────────────────────────────────────── */
.gjs-toolbar {
  background-color: #111421 !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
  padding: 2px !important;
}

.gjs-toolbar-item {
  color: rgba(255,255,255,0.6) !important;
  padding: 4px 6px !important;
  border-radius: 4px !important;
  transition: all 0.15s ease !important;
}
.gjs-toolbar-item:hover {
  color: #E91E8C !important;
  background-color: rgba(233,30,140,0.1) !important;
}

/* ── Resizer ────────────────────────────────────────────────────────── */
.gjs-resizer-h {
  border: 2px solid #E91E8C !important;
}

/* ── Badge ──────────────────────────────────────────────────────────── */
.gjs-badge {
  background-color: #E91E8C !important;
  color: #fff !important;
  font-size: 10px !important;
  border-radius: 4px !important;
  padding: 2px 6px !important;
}

/* ── Highlighter ────────────────────────────────────────────────────── */
.gjs-highlighter,
.gjs-highlighter-sel {
  outline: 1px solid #E91E8C !important;
}

/* ── Rich Text Editor toolbar ───────────────────────────────────────── */
.gjs-rte-toolbar {
  background-color: #111421 !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 6px !important;
  box-shadow: 0 4px 16px rgba(0,0,0,0.4) !important;
}

.gjs-rte-action {
  color: rgba(255,255,255,0.6) !important;
  border-right: 1px solid rgba(255,255,255,0.06) !important;
  transition: all 0.15s ease !important;
}
.gjs-rte-action:hover {
  color: rgba(255,255,255,0.9) !important;
  background-color: rgba(255,255,255,0.06) !important;
}
.gjs-rte-active {
  color: #E91E8C !important;
  background-color: rgba(233,30,140,0.12) !important;
}

/* ── Modal ──────────────────────────────────────────────────────────── */
.gjs-mdl-dialog {
  background-color: #181B2C !important;
  border: 1px solid rgba(255,255,255,0.08) !important;
  border-radius: 12px !important;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6) !important;
  color: rgba(255,255,255,0.85) !important;
}

.gjs-mdl-header {
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
  color: rgba(255,255,255,0.9) !important;
}

.gjs-mdl-title {
  color: rgba(255,255,255,0.9) !important;
  font-weight: 600 !important;
}

.gjs-mdl-btn-close {
  color: rgba(255,255,255,0.4) !important;
  transition: color 0.15s ease !important;
}
.gjs-mdl-btn-close:hover {
  color: rgba(255,255,255,0.8) !important;
}

.gjs-mdl-content {
  background: transparent !important;
}

.gjs-mdl-container {
  background-color: rgba(0,0,0,0.5) !important;
  backdrop-filter: blur(4px) !important;
}

/* ── Asset Manager ──────────────────────────────────────────────────── */
.gjs-am-assets {
  background: transparent !important;
}

.gjs-am-assets-header {
  background: transparent !important;
  color: rgba(255,255,255,0.5) !important;
  font-size: 11px !important;
  font-weight: 600 !important;
}

.gjs-am-asset-image {
  border: 1px solid rgba(255,255,255,0.06) !important;
  border-radius: 8px !important;
  background: rgba(255,255,255,0.03) !important;
  transition: border-color 0.15s ease !important;
}
.gjs-am-asset-image:hover {
  border-color: rgba(233,30,140,0.3) !important;
}

.gjs-am-file-uploader {
  background: rgba(255,255,255,0.03) !important;
  border: 2px dashed rgba(255,255,255,0.1) !important;
  border-radius: 8px !important;
  color: rgba(255,255,255,0.5) !important;
}
.gjs-am-file-uploader:hover {
  border-color: rgba(233,30,140,0.3) !important;
}

/* ── Color Picker ───────────────────────────────────────────────────── */
.gjs-color-picker,
.sp-container {
  background-color: #181B2C !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
}

.sp-input {
  background: rgba(255,255,255,0.04) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 4px !important;
  color: rgba(255,255,255,0.85) !important;
}

.sp-cancel,
.sp-choose,
.sp-palette-toggle {
  background: rgba(255,255,255,0.06) !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  color: rgba(255,255,255,0.7) !important;
  border-radius: 4px !important;
}
.sp-choose {
  background: rgba(233,30,140,0.2) !important;
  border-color: rgba(233,30,140,0.4) !important;
  color: #E91E8C !important;
}

/* ── Context Menu ───────────────────────────────────────────────────── */
.gjs-ctx-menu {
  background-color: #181B2C !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
  border-radius: 8px !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
  padding: 4px !important;
}

.gjs-ctx-menu .gjs-ctx-row {
  color: rgba(255,255,255,0.7) !important;
  border-radius: 4px !important;
  padding: 6px 10px !important;
  transition: all 0.1s ease !important;
}
.gjs-ctx-menu .gjs-ctx-row:hover {
  background-color: rgba(233,30,140,0.1) !important;
  color: rgba(255,255,255,0.95) !important;
}

/* ── Placeholder (drag target) ──────────────────────────────────────── */
.gjs-placeholder {
  border-color: #E91E8C !important;
}
.gjs-placeholder-int {
  background-color: rgba(233,30,140,0.15) !important;
}

/* ── Notooltip / empty state ────────────────────────────────────────── */
.gjs-no-select,
.gjs-no-app {
  color: rgba(255,255,255,0.4) !important;
}

/* ── Scrollbars inside GrapesJS panels ──────────────────────────────── */
.gjs-editor ::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.gjs-editor ::-webkit-scrollbar-track {
  background: transparent;
}
.gjs-editor ::-webkit-scrollbar-thumb {
  background: rgba(255,255,255,0.1);
  border-radius: 99px;
}
.gjs-editor ::-webkit-scrollbar-thumb:hover {
  background: rgba(255,255,255,0.2);
}

/* ── View buttons (top-right: Styles / Traits / Layers / Blocks) ──── */
.gjs-pn-views .gjs-pn-btn {
  font-size: 18px !important;
  padding: 6px 8px !important;
}

/* ── Selected component outline ─────────────────────────────────────── */
.gjs-selected {
  outline: 2px solid #E91E8C !important;
  outline-offset: -2px;
}

/* ── Hovered component outline ──────────────────────────────────────── */
.gjs-hovered {
  outline: 1px solid rgba(233,30,140,0.4) !important;
}

/* ── Spacing display on components ──────────────────────────────────── */
.gjs-margin-v-el,
.gjs-padding-v-el {
  opacity: 0.4 !important;
}

/* ── Dropdown / select styling ──────────────────────────────────────── */
.gjs-field select {
  background-color: rgba(255,255,255,0.04) !important;
  border: none !important;
}

.gjs-field option {
  background-color: #181B2C !important;
  color: rgba(255,255,255,0.85) !important;
}

/* ── SM clear button ────────────────────────────────────────────────── */
.gjs-sm-clear {
  color: rgba(255,255,255,0.3) !important;
  transition: color 0.15s ease !important;
}
.gjs-sm-clear:hover {
  color: #EF4444 !important;
}

/* ── Units dropdown ─────────────────────────────────────────────────── */
.gjs-field-units,
.gjs-input-unit {
  color: rgba(255,255,255,0.4) !important;
  background: transparent !important;
}

/* ── Panels container ───────────────────────────────────────────────── */
.gjs-pn-panels {
  border-bottom: 1px solid rgba(255,255,255,0.06) !important;
}

/* ── Fix right container width for usability ────────────────────────── */
.gjs-cv-canvas__frames {
  background: #0A0B14 !important;
}
`

// ─── Props ──────────────────────────────────────────────────────────────────

interface GrapesEditorProps {
  pageId?: string
  initialTitle?: string
  initialSlug?: string
  initialProject?: unknown
  initialHtml?: string
  onSave: (data: { html: string; css: string; project: unknown }) => Promise<void>
}

// ─── Component ──────────────────────────────────────────────────────────────

export function GrapesEditor({
  pageId: _pageId,
  initialTitle,
  initialSlug: _initialSlug,
  initialProject,
  initialHtml,
  onSave,
}: GrapesEditorProps) {
  const editorRef = useRef<Editor | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeDevice, setActiveDevice] = useState('Desktop')

  // ── Save handler ────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    const editor = editorRef.current
    if (!editor || isSaving) return
    setIsSaving(true)
    try {
      const html = editor.getHtml()
      const css = editor.getCss()
      const project = editor.getProjectData()
      await onSave({ html, css: css ?? '', project })
    } finally {
      setIsSaving(false)
    }
  }, [onSave, isSaving])

  const handlePublish = useCallback(async () => {
    await handleSave()
  }, [handleSave])

  // ── Device switcher ───────────────────────────────────────────────────

  const switchDevice = useCallback((deviceName: string) => {
    const editor = editorRef.current
    if (!editor) return
    editor.setDevice(deviceName)
    setActiveDevice(deviceName)
  }, [])

  // ── Editor ready callback ─────────────────────────────────────────────

  const onEditor = useCallback(
    (editor: Editor) => {
      editorRef.current = editor

      // Load initial data
      if (initialProject && typeof initialProject === 'object') {
        editor.loadProjectData(initialProject as Parameters<Editor['loadProjectData']>[0])
      } else if (initialHtml) {
        editor.setComponents(initialHtml)
      }

      // Inject canvas CSS (template design tokens) into the iframe
      const canvasDoc = editor.Canvas.getDocument()
      if (canvasDoc) {
        const style = canvasDoc.createElement('style')
        style.textContent = CANVAS_CSS
        canvasDoc.head.appendChild(style)
      }
      // Also apply on subsequent frame loads
      editor.on('canvas:frame:load', ({ window: frameWindow }) => {
        if (frameWindow?.document) {
          const s = frameWindow.document.createElement('style')
          s.textContent = CANVAS_CSS
          frameWindow.document.head.appendChild(s)
        }
      })

      // Track device changes from the built-in GrapesJS device manager too
      editor.on('device:select', () => {
        const dev = editor.getDevice()
        setActiveDevice(dev)
      })

      // Keyboard shortcut for save
      editor.Commands.add('overcms:save', {
        run: () => {
          handleSave()
        },
      })
      editor.Keymaps.add('overcms:save', 'ctrl+s', 'overcms:save')
      editor.Keymaps.add('overcms:save:mac', 'cmd+s', 'overcms:save')
    },
    [initialProject, initialHtml, handleSave],
  )

  // ── GrapesJS editor options ─────────────────────────────────────────────

  const gjsOptions = {
    height: '100%',
    width: 'auto',
    fromElement: false,
    storageManager: false as const,
    undoManager: { trackSelection: false },
    deviceManager: {
      devices: [
        { name: 'Desktop', width: '' },
        { name: 'Tablet', width: '768px', widthMedia: '992px' },
        { name: 'Mobile', width: '375px', widthMedia: '480px' },
      ],
    },
    canvas: {
      styles: [
        'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap',
      ],
      frameStyle: CANVAS_CSS,
    },
    panels: {
      defaults: [
        {
          id: 'views',
          buttons: [
            { id: 'open-blocks', active: true, command: 'open-blocks', className: 'fa fa-th-large', attributes: { title: 'Bloki' } },
            { id: 'open-sm', command: 'open-sm', className: 'fa fa-paint-brush', attributes: { title: 'Style' } },
            { id: 'open-layers', command: 'open-layers', className: 'fa fa-bars', attributes: { title: 'Warstwy' } },
            { id: 'open-tm', command: 'open-tm', className: 'fa fa-cog', attributes: { title: 'Ustawienia' } },
          ],
        },
        {
          id: 'options',
          buttons: [
            { id: 'preview', command: 'preview', className: 'fa fa-eye', attributes: { title: 'Podglad' } },
            { id: 'fullscreen', command: 'fullscreen', className: 'fa fa-arrows-alt', attributes: { title: 'Pelny ekran' } },
            { id: 'undo', command: 'core:undo', className: 'fa fa-undo', attributes: { title: 'Cofnij' } },
            { id: 'redo', command: 'core:redo', className: 'fa fa-repeat', attributes: { title: 'Ponow' } },
            { id: 'export', command: 'export-template', className: 'fa fa-code', attributes: { title: 'Eksportuj kod' } },
          ],
        },
      ],
    },
    blockManager: {
      blocks: [],
    },
    selectorManager: {
      componentFirst: true,
    },
  }

  // ── Device definitions for our toolbar ─────────────────────────────────

  const devices = [
    { name: 'Desktop', icon: Monitor },
    { name: 'Tablet', icon: Tablet },
    { name: 'Mobile', icon: Smartphone },
  ]

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      {/* Inject dark theme CSS overrides */}
      <style dangerouslySetInnerHTML={{ __html: DARK_THEME_CSS }} />

      {/* ── Top Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--glass-card-bg)] backdrop-blur-sm shrink-0 z-10">
        {/* Back */}
        <Link
          href="/pages"
          className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Strony
        </Link>

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Page title */}
        <span className="text-sm font-medium text-[var(--color-foreground)] truncate max-w-[200px]">
          {initialTitle || 'Nowa strona'}
        </span>

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Device switcher */}
        <div className="flex items-center gap-1">
          {devices.map(({ name, icon: Icon }) => {
            const isActive = activeDevice === name
            return (
              <button
                key={name}
                type="button"
                onClick={() => switchDevice(name)}
                className={`p-1.5 rounded-[var(--radius-sm)] transition-colors ${
                  isActive
                    ? 'bg-[var(--color-primary-muted)] text-[var(--color-primary)]'
                    : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)]'
                }`}
                title={name}
              >
                <Icon className="w-4 h-4" />
              </button>
            )
          })}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Undo / Redo */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => editorRef.current?.UndoManager.undo()}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            title="Cofnij (Ctrl+Z)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editorRef.current?.UndoManager.redo()}
            className="p-1.5 rounded-[var(--radius-sm)] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-surface-elevated)] transition-colors"
            title="Ponow (Ctrl+Shift+Z)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-5 bg-[var(--color-border)]" />

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium border border-[var(--color-border-hover)] text-[var(--color-foreground)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-40"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Zapisywanie...' : 'Zapisz'}
        </button>

        {/* Publish */}
        <button
          type="button"
          onClick={handlePublish}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium text-white gradient-bg shadow-[var(--shadow-pink)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          <Globe className="w-3.5 h-3.5" />
          Opublikuj
        </button>
      </div>

      {/* ── GrapesJS Editor (renders its own full UI) ───────────── */}
      <div className="flex-1 min-h-0">
        <GjsEditor
          className="h-full"
          grapesjs={grapesjs}
          options={gjsOptions}
          plugins={[
            overcmsBlocksPlugin,
            grapesjsPresetWebpage as unknown as (() => void),
          ]}
          onEditor={onEditor}
        >
          <Canvas className="h-full" />
        </GjsEditor>
      </div>
    </div>
  )
}
