import { apiClient } from '@/lib/api'

export interface RaceResult {
  roomId: string
  userId: string
  username: string
  wpm: number
  accuracy: number
  duration: number
  position: number
  completed: boolean
  totalParticipants: number
}

export async function submitRaceResult(raceResult: RaceResult) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/races/${raceResult.roomId}/finish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        wpm: raceResult.wpm,
        accuracy: raceResult.accuracy,
        correctChars: 0,
        incorrectChars: 0,
        totalChars: 0,
        timeElapsed: raceResult.duration,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to submit race result')
    }

    const data = await response.json()
    console.log('Race result submitted successfully:', data)
    return data
  } catch (error) {
    console.error('Error submitting race result:', error)
    throw error
  }
}

export async function getRaceResults(roomId: string) {
  try {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';
    const response = await fetch(`${apiUrl}/api/races/${roomId}/results`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch race results')
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching race results:', error)
    throw error
  }
}

export async function getUserStats() {
  try {
    const response = await apiClient.getMyRanking()
    return response.data
  } catch (error) {
    console.error('Error fetching user stats:', error)
    throw error
  }
}
