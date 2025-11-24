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
      <div style={{ backgroundColor: "white" }}>{props.children}</div>
    </>
  );
}
