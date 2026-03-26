// scripts/instagram/export.ts
import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

/**
 * Renders an HTML string to a 1080×1080 PNG file.
 * @param html  Full HTML document string
 * @param outPath  Absolute path for the output PNG
 */
export async function htmlToPng(html: string, outPath: string): Promise<void> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'networkidle0' })
    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    await page.screenshot({ path: outPath as `${string}.png`, type: 'png' })
  } finally {
    await browser.close()
  }
}
