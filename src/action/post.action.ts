'use server';

import { prisma } from '@/lib/prisma';
import { getDbUserId } from './user.action';
import { revalidatePath } from 'next/cache';

export async function createPost(content: string, image: string) {
  try {
    const userId = await getDbUserId();

    if (!userId) return;

    const post = await prisma.post.create({
      data: {
        content,
        image: image,
        authorId: userId,
      },
    });
    revalidatePath('/');
    return { success: true, post };
  } catch (error) {
    console.log('failed to create post', error);
    return { success: false, error: 'failed to create post' };
  }
}

export async function getPosts() {
  try {
    const posts = await prisma.post.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            image: true,
            username: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                image: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return posts;
  } catch (error) {
    console.log('error in getPosts: ', error);
    throw new Error('Failed to fetch posts');
  }
}

export async function toggleLike(postId: string) {
  try {
    const userId = await getDbUserId();
    if (!userId) return;

    //check if like exists

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    //grab post

    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    if (!post) throw new Error('post not found');

    //do unlike and like
    if (existingLike) {
      //do unlike
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId,
            postId,
          },
        },
      });
    } else {
      //do like and create nofication (2 entity using transaction) only if liking someone else's post
      await prisma.$transaction([
        prisma.like.create({
          data: {
            postId,
            userId,
          },
        }),
        ...(post.authorId !== userId
          ? [
              prisma.notification.create({
                // contoh 'user x=$creatorID Like=$type your=$userId post=$postId'
                // in breakdown you need property of type,userId,creatorId,postId
                data: {
                  type: 'LIKE',
                  userId: post.authorId, //recipient of the notify
                  creatorId: userId, //person who liked
                  postId,
                },
              }),
            ]
          : []), //if liking own post, no notification
      ]);
    }
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.log('error in toggleLike: ', error);
    return { success: false, error: 'error toggling like' };
  }
}

//butuh isi komen nya serta post mana(id post mana) yang di komen user
export async function createComment(postId: string, content: string) {
  try {
    //seperti biasa cek auth/hak syarat user bisa komen hanya jika kedaftar? getDBuserId : return

    const userId = await getDbUserId();

    if (!userId) return;
    //kalau ga ada isi tulisan komennya, return error
    if (!content) throw new Error('content is required');

    //kalau sudah cek userId, lanjut cek post(user yg mau dikomen) ada atau ngga?
    //cek apakah postId nya ada di db
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    // console.log('post: ', post);
    //kalau post tidak ada/dihapus, kasih error
    if (!post) throw new Error('post not found');

    //kalau ada, buat komen + kasih notifikasi, pake transaksi buat 2 kueri sekaligus

    const [comment] = await prisma.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId: userId,
          postId,
        },
      });

      //buat notifikasi, kalau yang komen bukan si author post
      if (post.authorId !== userId) {
        await tx.notification.create({
          data: {
            type: 'COMMENT',
            userId: post.authorId,
            creatorId: userId,
            postId,
            commentId: newComment.id,
          },
        });
      }

      return [newComment];
    });

    revalidatePath(`/`);
    return { success: true, comment };
  } catch (error) {
    console.log('error in createComment: ', error);
    return { success: false, error: 'error creating comment' };
  }
}

export async function deletePost(postId: string) {
  try {
    //cek userId
    const userId = await getDbUserId();

    if (!userId) return;

    //cek post is exist/ ada ngga?
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    //jika gada post
    if (!post) throw new Error('post not found');
    //jika bukan yg buat post, gada hak delete
    if (post.authorId !== userId) throw new Error('unauthorized - no delete permission');

    await prisma.post.delete({
      where: { id: postId },
    });

    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.log('error in deletePost: ', error);
    return { success: false, error: 'error deleting post' };
  }
}
