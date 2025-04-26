import express from "express"
import { PrismaClient } from "@prisma/client"

const router = express.Router()
const prisma = new PrismaClient()

// Helper to calculate percentage improvement
function calculateImprovement(current, previous) {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

// 1) Add shooting performance
router.post("/add", async (req, res) => {
  try {
    const { userId, shotsMade, shotsAttempted, date } = req.body
    const data = { userId, shotsMade, shotsAttempted }
    if (date) data.date = new Date(date)
    const newPerformance = await prisma.performance.create({ data })
    return res.status(201).json(newPerformance)
  } catch (error) {
    console.error("Error registering performance:", error)
    return res.status(500).json({ error: "Error registering performance." })
  }
})

// 2) Fetch all sessions for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const sessions = await prisma.performance.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    })
    return res.json(sessions)
  } catch (error) {
    console.error("Error fetching sessions:", error)
    return res.status(500).json({ error: "Error fetching sessions." })
  }
})

// 3) Get daily, weekly, and monthly improvements based on accuracy
router.get("/improvement/:userId", async (req, res) => {
  try {
    const { userId } = req.params
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(404).json({ error: "User not found." })

    const now = new Date()

    // --- Daily period boundaries ---
    const startOfToday = new Date(now)
    startOfToday.setHours(0, 0, 0, 0)
    const startOfTomorrow = new Date(startOfToday)
    startOfTomorrow.setDate(startOfTomorrow.getDate() + 1)
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)

    // Aggregate shots for today and yesterday
    const [todayAgg, yesterdayAgg] = await Promise.all([
      prisma.performance.aggregate({
        where: { userId, date: { gte: startOfToday, lt: startOfTomorrow } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
      prisma.performance.aggregate({
        where: { userId, date: { gte: startOfYesterday, lt: startOfToday } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
    ])

    const todayMade = todayAgg._sum.shotsMade ?? 0
    const todayAtt = todayAgg._sum.shotsAttempted ?? 0
    const yesterdayMade = yesterdayAgg._sum.shotsMade ?? 0
    const yesterdayAtt = yesterdayAgg._sum.shotsAttempted ?? 0

    let improvementDaily = null
    if (todayAtt > 0 && yesterdayAtt > 0) {
      const todayAcc = todayMade / todayAtt
      const yesterdayAcc = yesterdayMade / yesterdayAtt
      improvementDaily = calculateImprovement(todayAcc, yesterdayAcc)
    }

    // --- Weekly period boundaries ---
    const dayOfWeek = now.getDay()
    const diffToMonday = (dayOfWeek + 6) % 7
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - diffToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    const startPrevWeek = new Date(startOfWeek)
    startPrevWeek.setDate(startPrevWeek.getDate() - 7)

    const [currWeekAgg, prevWeekAgg] = await Promise.all([
      prisma.performance.aggregate({
        where: { userId, date: { gte: startOfWeek, lte: now } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
      prisma.performance.aggregate({
        where: { userId, date: { gte: startPrevWeek, lt: startOfWeek } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
    ])

    const currWeekMade = currWeekAgg._sum.shotsMade ?? 0
    const currWeekAtt = currWeekAgg._sum.shotsAttempted ?? 0
    const prevWeekMade = prevWeekAgg._sum.shotsMade ?? 0
    const prevWeekAtt = prevWeekAgg._sum.shotsAttempted ?? 0

    let improvementWeekly = null
    if (currWeekAtt > 0 && prevWeekAtt > 0) {
      const currWeekAcc = currWeekMade / currWeekAtt
      const prevWeekAcc = prevWeekMade / prevWeekAtt
      improvementWeekly = calculateImprovement(currWeekAcc, prevWeekAcc)
    }

    // --- Monthly period boundaries ---
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const endPrevMonth = new Date(startOfMonth)
    endPrevMonth.setMilliseconds(endPrevMonth.getMilliseconds() - 1)

    const [currMoAgg, prevMoAgg] = await Promise.all([
      prisma.performance.aggregate({
        where: { userId, date: { gte: startOfMonth, lte: now } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
      prisma.performance.aggregate({
        where: { userId, date: { gte: startPrevMonth, lte: endPrevMonth } },
        _sum: { shotsMade: true, shotsAttempted: true },
      }),
    ])

    const currMoMade = currMoAgg._sum.shotsMade ?? 0
    const currMoAtt = currMoAgg._sum.shotsAttempted ?? 0
    const prevMoMade = prevMoAgg._sum.shotsMade ?? 0
    const prevMoAtt = prevMoAgg._sum.shotsAttempted ?? 0

    let improvementMonthly = null
    if (currMoAtt > 0 && prevMoAtt > 0) {
      const currMoAcc = currMoMade / currMoAtt
      const prevMoAcc = prevMoMade / prevMoAtt
      improvementMonthly = calculateImprovement(currMoAcc, prevMoAcc)
    }

    return res.json({ improvementDaily, improvementWeekly, improvementMonthly })
  } catch (error) {
    console.error("Error calculating improvement:", error)
    return res.status(500).json({ error: "Error calculating improvement." })
  }
})

export default router