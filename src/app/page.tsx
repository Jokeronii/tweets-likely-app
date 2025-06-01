// import ModeToggle from '@/components/mode-toggle';
// import { Button } from '@/components/ui/button';
// import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';

import { getPosts } from '@/action/post.action';
import { getDbUserId } from '@/action/user.action';
import CreatePost from '@/components/create-post';
import PostCard from '@/components/post-card';
import WhoToFollow from '@/components/who-to-follow';
import { currentUser } from '@clerk/nextjs/server';

export default async function Home() {
  //cek auth user
  const user = await currentUser();
  const posts = await getPosts();
  const dbUserId = await getDbUserId();

  // console.log(posts);
  // if(!user) return

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        <div className="lg: col-span-6">
          {user ? <CreatePost /> : null}

          <div className="space-y-6">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} dbUserId={dbUserId} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block  lg:col-span-4 sticky top-20">
          <WhoToFollow />
        </div>
      </div>
    </>
  );
}
