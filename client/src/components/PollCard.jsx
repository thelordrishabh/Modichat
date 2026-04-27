export default function PollCard({ poll, onVote, isVoted }) {
  if (!poll?.question || !poll?.options?.length) return null;

  const totalVotes = poll.options.reduce((sum, option) => sum + (option.votes?.length || 0), 0);

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{poll.question}</h4>
      {poll.options.map((option, index) => {
        const votes = option.votes?.length || 0;
        const percentage = totalVotes ? Math.round((votes / totalVotes) * 100) : 0;
        return (
          <button
            key={`${option.text}-${index}`}
            type="button"
            disabled={isVoted}
            onClick={() => onVote?.(index)}
            className="relative flex min-h-11 w-full items-center justify-between overflow-hidden rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
          >
            {isVoted ? (
              <span className="absolute inset-y-0 left-0 bg-blue-500/20" style={{ width: `${percentage}%` }} />
            ) : null}
            <span className="relative z-10">{option.text}</span>
            <span className="relative z-10 text-xs font-semibold">{isVoted ? `${percentage}%` : ""}</span>
          </button>
        );
      })}
      <p className="text-xs text-gray-500 dark:text-gray-400">{totalVotes} votes</p>
    </div>
  );
}
