'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Comment {
    _id: string;
    comment: string;
    clientName: string;
    createdAt: string;
}

interface PhotoCommentSectionProps {
    photoId: string;
    comments: Comment[];
    onAddComment: (photoId: string, comment: string) => Promise<void>;
    canComment: boolean;
}

// Helper function to get initials from name
function getInitials(name: string): string {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

// Helper function to get avatar color based on name
function getAvatarColor(name: string): string {
    const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-orange-500',
        'bg-teal-500',
        'bg-indigo-500',
        'bg-cyan-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
}

export function PhotoCommentSection({
    photoId,
    comments: initialComments,
    onAddComment,
    canComment,
}: PhotoCommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newComment.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onAddComment(photoId, newComment.trim());

            // Add optimistic comment
            const optimisticComment: Comment = {
                _id: Date.now().toString(),
                comment: newComment.trim(),
                clientName: 'You',
                createdAt: new Date().toISOString(),
            };

            setComments([optimisticComment, ...comments]);
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {comments.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No comments yet
                    </p>
                ) : (
                    comments.map((comment) => (
                        <div key={comment._id} className="flex gap-3">
                            {/* Avatar */}
                            <div
                                className={`flex-shrink-0 w-10 h-10 rounded-full ${getAvatarColor(
                                    comment.clientName
                                )} flex items-center justify-center text-white font-medium text-sm`}
                            >
                                {getInitials(comment.clientName)}
                            </div>

                            {/* Comment Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-foreground">
                                        {comment.clientName}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        · {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-foreground break-words">
                                    {comment.comment}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add Comment Form - Fixed at Bottom */}
            {canComment && (
                <div className="sticky bottom-0 bg-white pt-4 border-t mt-auto">
                    <form onSubmit={handleSubmit}>
                        <div className="flex gap-3 items-center">
                            {/* User Avatar */}
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-sm">
                                D
                            </div>

                            {/* Input Field */}
                            <div className="flex-1 relative">
                                <Input
                                    placeholder="Say something"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    disabled={isSubmitting}
                                    className="pr-12 rounded-full border-gray-300 focus:border-primary"
                                />
                                {newComment.trim() && (
                                    <Button
                                        type="submit"
                                        size="icon"
                                        disabled={isSubmitting}
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full"
                                    >
                                        {isSubmitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
