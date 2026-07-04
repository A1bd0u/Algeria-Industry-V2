import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

router.get('/analytics', requireAuth, async (req, res) => {
  const timeframe = req.query.timeframe || '6m';
  
  const wilayaData = timeframe === '6m' ? [
    { name: 'Alger (16)', value: 4500, color: '#1B4D2E' },
    { name: 'Oran (31)', value: 2800, color: '#0EA5E9' },
    { name: 'Sétif (19)', value: 2100, color: '#F59E0B' },
    { name: 'Hassi Messaoud (30)', value: 1900, color: '#8B5CF6' },
    { name: 'Blida (09)', value: 1400, color: '#F43F5E' },
  ] : [
    { name: 'Alger (16)', value: 8500, color: '#1B4D2E' },
    { name: 'Oran (31)', value: 4800, color: '#0EA5E9' },
    { name: 'Sétif (19)', value: 3100, color: '#F59E0B' },
    { name: 'Hassi Messaoud (30)', value: 3000, color: '#8B5CF6' },
    { name: 'Blida (09)', value: 2400, color: '#F43F5E' },
  ];
  
  const termsData = timeframe === '6m' ? [
    { term: 'Turbine', volume: 850 },
    { term: 'Acier', volume: 620 },
    { term: 'Solaire', volume: 540 },
    { term: 'HSE', volume: 480 },
    { term: 'Valves', volume: 390 },
  ] : [
    { term: 'Turbine', volume: 1650 },
    { term: 'Acier', volume: 1420 },
    { term: 'Solaire', volume: 1140 },
    { term: 'HSE', volume: 980 },
    { term: 'Valves', volume: 890 },
  ];

  const registrationsData = timeframe === '6m' ? [
    { month: 'Jan', count: 120 },
    { month: 'Fév', count: 150 },
    { month: 'Mar', count: 200 },
    { month: 'Avr', count: 180 },
    { month: 'Mai', count: 250 },
    { month: 'Juin', count: 300 },
  ] : [
    { month: 'Juil', count: 90 },
    { month: 'Aoû', count: 110 },
    { month: 'Sep', count: 160 },
    { month: 'Oct', count: 140 },
    { month: 'Nov', count: 190 },
    { month: 'Déc', count: 210 },
    { month: 'Jan', count: 120 },
    { month: 'Fév', count: 150 },
    { month: 'Mar', count: 200 },
    { month: 'Avr', count: 180 },
    { month: 'Mai', count: 250 },
    { month: 'Juin', count: 300 },
  ];

  return res.json({
    wilayas: wilayaData,
    searchTerms: termsData,
    registrations: registrationsData,
    totalIntents: timeframe === '6m' ? 12700 : 21800
  });
});

export default router;
