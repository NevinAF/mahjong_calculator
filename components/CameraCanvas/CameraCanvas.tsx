import React from "react";
import Image from "next/image";
import applyDefaults from "@utils/ClassNameDefaults";

interface CameraCanvasProps
{
	className?: string;
	objectFit?: NonNullable<JSX.IntrinsicElements['img']['style']>["objectFit"];
	style?: React.CSSProperties;
}

export default class CameraCanvas extends React.Component<CameraCanvasProps, { videoStream: MediaStream | null, currentCamera: number, cameras: MediaDeviceInfo[], canvasContext: CanvasRenderingContext2D | null }>
{
	videoRef: React.RefObject<HTMLVideoElement>;
	canvasRef: React.RefObject<HTMLCanvasElement>;
	animationId?: number;
	animationPreviousTimestamp?: number;

	constructor(props: CameraCanvasProps)
	{
		super(props);

		this.videoRef = React.createRef<HTMLVideoElement>();
		this.canvasRef = React.createRef<HTMLCanvasElement>();
		this.animationId = undefined;
		this.animationPreviousTimestamp = undefined;

		this.changeCamera = this.changeCamera.bind(this);
		this.updateCanvas = this.updateCanvas.bind(this);
		this.animate = this.animate.bind(this);

		this.state = {
			videoStream: null,
			currentCamera: 0,
			cameras: [],
			canvasContext: null
		};
	}

	updateDeviceList()
	{
		navigator.mediaDevices?.enumerateDevices()
			.then((devices) =>
			{
				const cameras = devices.filter((device) => device.kind === "videoinput");
				this.setState({ cameras: cameras, currentCamera: this.state.currentCamera >= cameras.length ? 0 : this.state.currentCamera });
			})
			.catch((err) =>
			{
				console.log(err);
			});
	}

	componentDidMount(): void
	{
		navigator.mediaDevices?.addEventListener("devicechange", this.updateDeviceList);

		if (this.canvasRef.current)
		{
			this.setState({ canvasContext: this.canvasRef.current.getContext("2d") });
		}
	}
	
	componentWillUnmount(): void
	{
		navigator.mediaDevices?.removeEventListener("devicechange", this.updateDeviceList);
	}

	changeCamera = () =>
	{
		if (this.state.videoStream)
		{
			this.state.videoStream.getTracks().forEach((track) => track.stop());
			this.setState({ currentCamera: (this.state.currentCamera + 1) % this.state.cameras.length, videoStream: null });
		}

		navigator.mediaDevices?.getUserMedia({ video: { deviceId: this.state.cameras[this.state.currentCamera].deviceId } })
			.then((stream) =>
			{
				if (this.videoRef.current)
				{
					this.videoRef.current.width = stream.getVideoTracks()[0].getSettings().width ?? 1280;
					this.videoRef.current.height = stream.getVideoTracks()[0].getSettings().height ?? 720;
					this.videoRef.current.srcObject = stream;
				}
				this.setState({ videoStream: stream });
			})
			.catch((err) =>
			{
				console.log(err);
			});
	};

	closeCamera = () =>
	{
		if (this.state.videoStream)
		{
			this.state.videoStream.getTracks().forEach((track) => track.stop());
			this.setState({ videoStream: null });
		}
	};

	updateCanvas = () =>
	{
		if (this.state.videoStream && this.state.canvasContext)
		{
			const video = this.videoRef.current;
			const canvas = this.canvasRef.current;
			if (video && canvas)
			{
				this.state.canvasContext.canvas.width = video.videoWidth;
				this.state.canvasContext.canvas.height = video.videoHeight;
				this.state.canvasContext.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
			}
		}
	};

	animate(timestamp: number)
	{
		const frameRate = this.state.videoStream?.getVideoTracks()[0].getSettings().frameRate ?? 30;
		if (this.animationPreviousTimestamp === undefined || timestamp - this.animationPreviousTimestamp > 1000 / frameRate)
		{
			this.updateCanvas();

			this.animationPreviousTimestamp = timestamp;
		}

		this.animationId = window.requestAnimationFrame(this.animate);
	};

	// display the video stream and a canvas scaled to the size of the page
	render = () =>
	{
		const recording = this.state.videoStream !== null && this.state.canvasContext !== null && this.videoRef.current !== null && this.canvasRef.current !== null;

		if (recording)
		{
			if (this.animationId === undefined)
			{
				this.animationId = window.requestAnimationFrame(this.animate);
			}
		} else
		{
			if (this.animationId !== undefined)
			{
				window.cancelAnimationFrame(this.animationId);
				this.animationId = undefined;
			}
		}

		return (
			<>
				<video className="hidden" ref={this.videoRef} autoPlay={true} />
				<div className={applyDefaults(this.props.className, {
					width: "w-full",
					height: "h-full"
				})} style={this.props.style}>
					<div className={"relative w-full h-full " + (recording ? "hidden" : "visible")}>
						<Image objectFit={this.props.objectFit} src={"/icons/cameraNotWorking.jpg"} alt="Camera not working" width={1280} height={720} layout="fill" />
					</div>
					<canvas className={recording ? "visible" : "hidden"} ref={this.canvasRef} style={{
						objectFit: this.props.objectFit
					}} />
				</div>
			</>
		)
	};
}