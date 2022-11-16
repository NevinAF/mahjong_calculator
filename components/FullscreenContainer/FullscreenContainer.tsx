import applyDefaults from "@scripts/utils/ClassNameDefaults";
import React, { RefObject } from "react";

export interface FullscreenContainerProps
{
	className?: string;
	style?: React.CSSProperties;
	visibleWhileMinimized?: boolean,
	children: React.ReactNode,
}

export default class FullscreenContainer extends React.Component<FullscreenContainerProps, { isFullscreen: boolean }>
{
	fullscreenElement: RefObject<HTMLDivElement>;

	constructor(props: FullscreenContainerProps)
	{
		super(props);
		this.fullscreenElement = React.createRef<HTMLDivElement>();

		this.state = {
			isFullscreen: false
		}

		this.toggleFullscreen = this.toggleFullscreen.bind(this);
	}

	toggleFullscreen = () =>
	{
		if (document.fullscreenElement)
		{
			if (document.exitFullscreen)
			{
				document.exitFullscreen();
			}
			// @ts-ignore
			else if (document.webkitExitFullscreen)
			{
				// @ts-ignore
				document.webkitExitFullscreen();
			}
			// @ts-ignore
			else if (document.mozCancelFullScreen)
			{
				// @ts-ignore
				document.mozCancelFullScreen();
			}
			// @ts-ignore
			else if (document.msExitFullscreen)
			{
				// @ts-ignore
				document.msExitFullscreen();
			}
		}
		else if (this.fullscreenElement.current)
		{
			if (this.fullscreenElement.current.requestFullscreen)
			{
				this.fullscreenElement.current.requestFullscreen();
			}
			// @ts-ignore
			else if (this.fullscreenElement.current.webkitRequestFullscreen)
			{
				// @ts-ignore
				this.fullscreenElement.current.webkitRequestFullscreen();
			}
			// @ts-ignore
			else if (this.fullscreenElement.current.mozRequestFullScreen)
			{
				// @ts-ignore
				this.fullscreenElement.current.mozRequestFullScreen();
			}
			// @ts-ignore
			else if (this.fullscreenElement.current.msRequestFullscreen)
			{
				// @ts-ignore
				this.fullscreenElement.current.msRequestFullscreen();
			}
		}
	};

	handleFullScreenChange = () =>
	{
		if (document.fullscreenElement)
		{
			this.setState({ isFullscreen: true });
		}
		else
		{
			this.setState({ isFullscreen: false });
		}
	};

	componentDidMount(): void {
		document.addEventListener("fullscreenchange", this.handleFullScreenChange);
		document.addEventListener("webkitfullscreenchange", this.handleFullScreenChange);
		document.addEventListener("mozfullscreenchange", this.handleFullScreenChange);
		document.addEventListener("MSFullscreenChange", this.handleFullScreenChange);
	}

	componentWillUnmount(): void {
		document.removeEventListener("fullscreenchange", this.handleFullScreenChange);
		document.removeEventListener("webkitfullscreenchange", this.handleFullScreenChange);
		document.removeEventListener("mozfullscreenchange", this.handleFullScreenChange);
		document.removeEventListener("MSFullscreenChange", this.handleFullScreenChange);
	}
	
	render()
	{
		console.log("Rendering fullscreen container");
		const show = this.state.isFullscreen || this.props.visibleWhileMinimized;
		return (
			<div ref={this.fullscreenElement} className={applyDefaults(this.props.className, {
				pointer_events: show ? "" : " pointer-events-none hidden",
				position: "fixed",
				top: "top-0",
				left: "left-0",
			})} style={this.props.style}>
				{show && this.props.children}
			</div>
		);
	}
}