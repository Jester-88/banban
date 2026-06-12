"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"
import { getKakaoProfile, type KakaoProfile } from "@/lib/kakao-profile"
import { createClient } from "@/lib/supabase/client"
import { fetchUserVote, type VoteChoice } from "@/lib/votes"

function sessionUser(session: Session | null): User | null {
  return session?.user ?? null
}

export function useAuth(questionSlug: string | null) {
  const [user, setUser] = useState<User | null>(null)
  const [existingVote, setExistingVote] = useState<VoteChoice | null>(null)
  const [loading, setLoading] = useState(true)

  const profile = useMemo(() => getKakaoProfile(user), [user])

  const applySession = useCallback((session: Session | null) => {
    const nextUser = sessionUser(session)
    setUser(nextUser)
    setLoading(false)

    if (!nextUser) {
      setExistingVote(null)
    }
  }, [])

  const clearSession = useCallback(() => {
    setUser(null)
    setExistingVote(null)
    setLoading(false)
  }, [])

  const signOut = useCallback(async () => {
    const supabase = createClient()

    try {
      await supabase.auth.signOut({ scope: "local" })
    } catch (error) {
      console.error("[banban] client signOut error:", error)
    }

    setUser(null)
    setExistingVote(null)
    setLoading(false)

    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      })
    } catch (error) {
      console.error("[banban] server signout API error:", error)
    }
  }, [])

  const refreshUserVote = useCallback(async () => {
    if (!user?.id || !questionSlug) {
      setExistingVote(null)
      return null
    }
    const vote = await fetchUserVote(questionSlug)
    setExistingVote(vote)
    return vote
  }, [user?.id, questionSlug])

  useEffect(() => {
    const supabase = createClient()
    let active = true

    void (async () => {
      const { data, error } = await supabase.auth.getSession()

      if (!active) return

      if (error) {
        console.error("[banban] getSession error:", error)
        setUser(null)
        setExistingVote(null)
        setLoading(false)
        return
      }

      applySession(data.session)
    })()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (!active) return

        console.log("[banban] auth event:", event, session?.user?.id ?? null)

        if (event === "SIGNED_OUT") {
          setUser(null)
          setExistingVote(null)
          setLoading(false)
          return
        }

        applySession(session)
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [applySession])

  useEffect(() => {
    if (!user?.id || !questionSlug) {
      setExistingVote(null)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const vote = await fetchUserVote(questionSlug)
        if (!cancelled) setExistingVote(vote)
      } catch (e) {
        console.error("[banban] user vote fetch error:", e)
        if (!cancelled) setExistingVote(null)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [user?.id, questionSlug])

  return {
    user,
    profile,
    existingVote,
    loading,
    hasVoted: existingVote !== null,
    refreshUserVote,
    clearSession,
    signOut,
  }
}

export type { KakaoProfile }
