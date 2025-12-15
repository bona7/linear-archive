import { useRouter } from "next/router";

interface ILayoutProps {
  children: JSX.Element;
}

export default function Layout(props: ILayoutProps): JSX.Element {
  const router = useRouter();
  const { pathname } = useRouter();

  console.log(router.asPath);

  return (
    <>
      <div
        style={{
          backgroundColor: "white",
          height: "calc(var(--vh, 1vh) * 100)",
          overflow: "hidden",
          width: "100%",
        }}
      >
        {props.children}
      </div>
    </>
  );
}
