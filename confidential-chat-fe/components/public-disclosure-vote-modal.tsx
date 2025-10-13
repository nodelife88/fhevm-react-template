"use client"

import { useState } from "react"
import { X, Vote, CheckCircle2, XCircle, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { UserAvatar } from "./user-avatar"

interface VoteData {
  messageId: string
  messagePreview: string
  sender: string
  timestamp: string
  votesFor: number
  votesAgainst: number
  totalVoters: number
  quorum: number
  deadline: string
  hasVoted: boolean
  userVote?: "for" | "against"
  voters: {
    address: string
    vote: "for" | "against"
    timestamp: string
  }[]
}

interface PublicDisclosureVoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  voteData: VoteData
  onVote: (messageId: string, vote: "for" | "against") => void
}

export function PublicDisclosureVoteModal({ open, onOpenChange, voteData, onVote }: PublicDisclosureVoteModalProps) {
  const [isVoting, setIsVoting] = useState(false)

  const handleVote = async (vote: "for" | "against") => {
    setIsVoting(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    onVote(voteData.messageId, vote)
    setIsVoting(false)
  }

  const votePercentage = Math.round((voteData.votesFor / (voteData.votesFor + voteData.votesAgainst)) * 100)
  const quorumPercentage = Math.round(((voteData.votesFor + voteData.votesAgainst) / voteData.totalVoters) * 100)
  const quorumReached = quorumPercentage >= voteData.quorum

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-black p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/10">
              <Vote className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Public Disclosure Vote</h2>
              <p className="text-sm text-white/60">Vote to make this message publicly visible</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Message Preview */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <UserAvatar address={voteData.sender} size="sm" />
              <div>
                <p className="text-sm font-medium text-white">{voteData.sender}</p>
                <p className="text-xs text-white/60">{voteData.timestamp}</p>
              </div>
            </div>
            <p className="text-sm text-white/80">{voteData.messagePreview}</p>
          </div>

          {/* Vote Status */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/80">Vote Progress</span>
              <span className="text-sm font-medium text-white">
                {voteData.votesFor + voteData.votesAgainst} / {voteData.totalVoters} voted
              </span>
            </div>

            {/* For/Against Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <span className="text-white/80">For</span>
                </div>
                <span className="font-medium text-white">
                  {voteData.votesFor} ({isNaN(votePercentage) ? 0 : votePercentage}%)
                </span>
              </div>
              <Progress value={votePercentage} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-400" />
                  <span className="text-white/80">Against</span>
                </div>
                <span className="font-medium text-white">
                  {voteData.votesAgainst} ({isNaN(votePercentage) ? 0 : 100 - votePercentage}%)
                </span>
              </div>
              <Progress value={100 - votePercentage} className="h-2" />
            </div>

            {/* Quorum Status */}
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-cyan-400" />
                  <span className="text-sm text-white/80">Quorum</span>
                </div>
                <Badge
                  variant={quorumReached ? "default" : "secondary"}
                  className={quorumReached ? "bg-green-500/20 text-green-400" : ""}
                >
                  {quorumReached ? "Reached" : "Not Reached"}
                </Badge>
              </div>
              <Progress value={quorumPercentage} className="h-2" />
              <p className="mt-2 text-xs text-white/60">
                {voteData.quorum}% quorum required ({Math.ceil((voteData.totalVoters * voteData.quorum) / 100)} votes)
              </p>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 text-sm text-white/60">
              <Clock className="h-4 w-4" />
              <span>Voting ends {voteData.deadline}</span>
            </div>
          </div>

          {/* Voters List */}
          {voteData.voters.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white/80">Recent Votes</p>
              <div className="max-h-[200px] space-y-2 overflow-y-auto">
                {voteData.voters.map((voter) => (
                  <div
                    key={voter.address}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-2"
                  >
                    <div className="flex items-center gap-2">
                      <UserAvatar address={voter.address} size="sm" />
                      <span className="font-mono text-sm text-white">
                        {voter.address.slice(0, 6)}...{voter.address.slice(-4)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {voter.vote === "for" ? (
                        <Badge className="bg-green-500/20 text-green-400">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          For
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500/20 text-red-400">
                          <XCircle className="mr-1 h-3 w-3" />
                          Against
                        </Badge>
                      )}
                      <span className="text-xs text-white/40">{voter.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vote Actions */}
          {!voteData.hasVoted ? (
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => handleVote("against")}
                disabled={isVoting}
                variant="outline"
                className="flex-1 border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="mr-2 h-4 w-4" />
                Vote Against
              </Button>
              <Button
                onClick={() => handleVote("for")}
                disabled={isVoting}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Vote For
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-cyan-500/50 bg-cyan-500/10 p-4 text-center">
              <p className="text-sm text-cyan-400">
                You voted <span className="font-semibold">{voteData.userVote === "for" ? "FOR" : "AGAINST"}</span> this
                disclosure
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
