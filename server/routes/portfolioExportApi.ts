import { Router } from 'express';
import { getDb } from '../db';
import { portfolios, portfolioPositions, portfolioSnapshots } from '../../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

// Helper to get user ID from request
const getUserId = (req: any): number => {
  return 1; // Placeholder user ID
};

// GET /api/portfolios/:id/export/excel - Export portfolio to Excel
router.get('/portfolios/:id/export/excel', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership and fetch portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Fetch positions
    const positions = await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    // Fetch snapshots
    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolioId))
      .orderBy(desc(portfolioSnapshots.date));
    
    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Investment Outlook 2026';
    workbook.created = new Date();
    
    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.columns = [
      { header: 'Metric', key: 'metric', width: 30 },
      { header: 'Value', key: 'value', width: 20 },
    ];
    
    const latestSnapshot = snapshots[0];
    if (latestSnapshot) {
      summarySheet.addRows([
        { metric: 'Portfolio Name', value: portfolio.name },
        { metric: 'Description', value: portfolio.description || 'N/A' },
        { metric: 'Created Date', value: new Date(portfolio.createdAt).toLocaleDateString() },
        { metric: 'Last Updated', value: new Date(portfolio.updatedAt).toLocaleDateString() },
        { metric: '', value: '' },
        { metric: 'Total Value', value: `$${parseFloat(latestSnapshot.totalValue).toLocaleString()}` },
        { metric: 'Total Return', value: `$${parseFloat(latestSnapshot.totalReturn || '0').toLocaleString()}` },
        { metric: 'Total Return %', value: `${parseFloat(latestSnapshot.totalReturnPercent || '0').toFixed(2)}%` },
        { metric: '', value: '' },
        { metric: 'Number of Positions', value: positions.length },
        { metric: 'Number of Snapshots', value: snapshots.length },
      ]);
    }
    
    // Style summary sheet
    summarySheet.getRow(1).font = { bold: true, size: 12 };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    summarySheet.getRow(1).font = { ...summarySheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    // Positions Sheet
    const positionsSheet = workbook.addWorksheet('Positions');
    positionsSheet.columns = [
      { header: 'Ticker', key: 'ticker', width: 15 },
      { header: 'Shares', key: 'shares', width: 15 },
      { header: 'Avg Cost', key: 'avgCost', width: 15 },
      { header: 'Current Price', key: 'currentPrice', width: 15 },
      { header: 'Total Value', key: 'totalValue', width: 15 },
      { header: 'Total Return', key: 'totalReturn', width: 15 },
      { header: 'Return %', key: 'returnPercent', width: 15 },
    ];
    
    positions.forEach(position => {
      const shares = parseFloat(position.shares);
      const avgCost = parseFloat(position.avgCost);
      const currentPrice = parseFloat(position.currentPrice || '0');
      const totalValue = shares * currentPrice;
      const totalCost = shares * avgCost;
      const totalReturn = totalValue - totalCost;
      const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0;
      
      positionsSheet.addRow({
        ticker: position.ticker,
        shares: shares,
        avgCost: avgCost,
        currentPrice: currentPrice,
        totalValue: totalValue,
        totalReturn: totalReturn,
        returnPercent: returnPercent,
      });
    });
    
    // Format positions sheet
    positionsSheet.getRow(1).font = { bold: true };
    positionsSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    positionsSheet.getRow(1).font = { ...positionsSheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    // Format currency columns
    positionsSheet.getColumn('avgCost').numFmt = '$#,##0.00';
    positionsSheet.getColumn('currentPrice').numFmt = '$#,##0.00';
    positionsSheet.getColumn('totalValue').numFmt = '$#,##0.00';
    positionsSheet.getColumn('totalReturn').numFmt = '$#,##0.00';
    positionsSheet.getColumn('returnPercent').numFmt = '0.00%';
    
    // Add conditional formatting for returns
    positionsSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        const returnCell = row.getCell('totalReturn');
        const returnValue = returnCell.value as number;
        if (returnValue > 0) {
          returnCell.font = { color: { argb: 'FF10B981' } };
        } else if (returnValue < 0) {
          returnCell.font = { color: { argb: 'FFEF4444' } };
        }
      }
    });
    
    // History Sheet
    const historySheet = workbook.addWorksheet('Performance History');
    historySheet.columns = [
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Total Value', key: 'totalValue', width: 20 },
      { header: 'Total Return', key: 'totalReturn', width: 20 },
      { header: 'Return %', key: 'returnPercent', width: 15 },
    ];
    
    snapshots.reverse().forEach(snapshot => {
      historySheet.addRow({
        date: new Date(snapshot.date).toLocaleDateString(),
        totalValue: parseFloat(snapshot.totalValue),
        totalReturn: parseFloat(snapshot.totalReturn || '0'),
        returnPercent: parseFloat(snapshot.totalReturnPercent || '0'),
      });
    });
    
    // Format history sheet
    historySheet.getRow(1).font = { bold: true };
    historySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' },
    };
    historySheet.getRow(1).font = { ...historySheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };
    
    historySheet.getColumn('totalValue').numFmt = '$#,##0.00';
    historySheet.getColumn('totalReturn').numFmt = '$#,##0.00';
    historySheet.getColumn('returnPercent').numFmt = '0.00%';
    
    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${portfolio.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    res.status(500).json({ error: 'Failed to export to Excel' });
  }
});

// GET /api/portfolios/:id/export/pdf - Export portfolio to PDF
router.get('/portfolios/:id/export/pdf', async (req, res) => {
  try {
    const userId = getUserId(req);
    const portfolioId = parseInt(req.params.id);
    
    const db = await getDb();
    if (!db) {
      return res.status(503).json({ error: 'Database not available' });
    }
    
    // Verify ownership and fetch portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(and(eq(portfolios.id, portfolioId), eq(portfolios.userId, userId)))
      .limit(1);
    
    if (!portfolio) {
      return res.status(404).json({ error: 'Portfolio not found' });
    }
    
    // Fetch positions
    const positions = await db
      .select()
      .from(portfolioPositions)
      .where(eq(portfolioPositions.portfolioId, portfolioId));
    
    // Fetch snapshots
    const snapshots = await db
      .select()
      .from(portfolioSnapshots)
      .where(eq(portfolioSnapshots.portfolioId, portfolioId))
      .orderBy(desc(portfolioSnapshots.date));
    
    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${portfolio.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf"`);
    
    doc.pipe(res);
    
    // Title
    doc.fontSize(24).fillColor('#4F46E5').text('Portfolio Performance Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(16).fillColor('#000000').text(portfolio.name, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#666666').text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(2);
    
    // Summary Section
    doc.fontSize(14).fillColor('#4F46E5').text('Portfolio Summary');
    doc.moveDown(0.5);
    
    if (snapshots.length > 0) {
      const latestSnapshot = snapshots[0];
      const totalValue = parseFloat(latestSnapshot.totalValue);
      const totalReturn = parseFloat(latestSnapshot.totalReturn || '0');
      const totalReturnPercent = parseFloat(latestSnapshot.totalReturnPercent || '0');
      
      doc.fontSize(10).fillColor('#000000');
      doc.text(`Total Value: $${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      doc.text(`Total Return: $${totalReturn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${totalReturnPercent.toFixed(2)}%)`);
      doc.text(`Number of Positions: ${positions.length}`);
      doc.text(`Created: ${new Date(portfolio.createdAt).toLocaleDateString()}`);
      doc.text(`Last Updated: ${new Date(portfolio.updatedAt).toLocaleDateString()}`);
    }
    
    doc.moveDown(2);
    
    // Positions Table
    doc.fontSize(14).fillColor('#4F46E5').text('Current Positions');
    doc.moveDown(0.5);
    
    // Table headers
    const tableTop = doc.y;
    const colWidths = [80, 80, 80, 80, 80, 80];
    const headers = ['Ticker', 'Shares', 'Avg Cost', 'Current', 'Value', 'Return %'];
    
    doc.fontSize(9).fillColor('#FFFFFF');
    doc.rect(50, tableTop, 480, 20).fill('#4F46E5');
    
    let xPos = 60;
    headers.forEach((header, i) => {
      doc.text(header, xPos, tableTop + 5, { width: colWidths[i], align: 'left' });
      xPos += colWidths[i];
    });
    
    // Table rows
    doc.fillColor('#000000');
    let yPos = tableTop + 25;
    
    positions.forEach((position, index) => {
      const shares = parseFloat(position.shares);
      const avgCost = parseFloat(position.avgCost);
      const currentPrice = parseFloat(position.currentPrice || '0');
      const totalValue = shares * currentPrice;
      const totalCost = shares * avgCost;
      const returnPercent = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;
      
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
      
      xPos = 60;
      const rowData = [
        position.ticker,
        shares.toFixed(2),
        `$${avgCost.toFixed(2)}`,
        `$${currentPrice.toFixed(2)}`,
        `$${totalValue.toFixed(2)}`,
        `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`,
      ];
      
      rowData.forEach((data, i) => {
        doc.text(data, xPos, yPos, { width: colWidths[i], align: 'left' });
        xPos += colWidths[i];
      });
      
      yPos += 20;
    });
    
    // Footer
    doc.fontSize(8).fillColor('#999999');
    doc.text(
      'This report is for informational purposes only and does not constitute investment advice.',
      50,
      750,
      { align: 'center', width: 500 }
    );
    
    doc.end();
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to export to PDF' });
    }
  }
});

export default router;
