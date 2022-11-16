import datetime
import math
import os
import cv2
import numpy as np

source_folder = "./andriods/"
output_folder = "./training/"

def twoBitThreshold(image: cv2.Mat):
	total: int = 0
	for y in range(0, image.shape[0]):
		for x in range(0, image.shape[1]):
			if (image[y, x, 0] < 64):
				image[y, x, 0] = 0
			elif (image[y, x, 0] < 128):
				image[y, x, 0] = 64
			else:
				image[y, x, 0] = 255
			if (image[y, x, 1] < 64):
				image[y, x, 1] = 0
			elif (image[y, x, 1] < 128):
				image[y, x, 1] = 64
			else:
				image[y, x, 1] = 255
			if (image[y, x, 2] < 64):
				image[y, x, 2] = 0
			elif (image[y, x, 2] < 128):
				image[y, x, 2] = 64
			else:
				image[y, x, 2] = 255

			total += image[y, x, 0]
			total += image[y, x, 1]
			total += image[y, x, 2]
	average: float = total / 120000

	return average

def GETPERSPECTIVEIMAGE(src_pts: cv2.Mat, des_pts: cv2.Mat, image: cv2.Mat, dimension: tuple[int, int]) -> cv2.Mat:
	M = cv2.getPerspectiveTransform(src_pts, des_pts)
	warped = cv2.warpPerspective(image, M, dimension)
	return warped

def scaleImage(cvImage: cv2.Mat, dim: tuple[int, int]) -> cv2.Mat:
	return cv2.resize(cvImage, dim, interpolation=cv2.INTER_CUBIC)

def rename_files():
	# (1) get file names from a folder
	file_list = os.listdir(source_folder)
	print(file_list)
	# (2) for each file, rename filename
	counter = 0
	for file_name in file_list:
		if file_name.endswith(".jpg"):
			os.rename(source_folder + file_name, source_folder + "PXL_" + str(counter) + ".jpg")
			counter += 1

file_list = [f for f in os.listdir(source_folder) if f.endswith('.jpg')]

counter = 0

for image_file in file_list:
	pastCounter = counter

	img = cv2.imread(source_folder + image_file, cv2.IMREAD_COLOR)

	# colorThresh = scaleImage(img.copy(), (800, 600))
	# twoBitThreshold(colorThresh)
	# cv2.imshow("colorThresh", scaleImage(colorThresh, (800, 600)))

	# cv2.imshow("img", scaleImage(img, (800, 600)))
	hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
	thresh = cv2.inRange(hsv, (0, 0, 180), (255, 90, 255))

	# cv2.imshow("threshss", scaleImage(thresh, (800, 600)))

	# find contours in the thresholded image
	cnts, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

	for c in cnts:
		contour_area = cv2.contourArea(c)
		if contour_area < 12000:
			continue

		hull = cv2.convexHull(c)
		approx = cv2.approxPolyDP(hull, 0.1 * cv2.arcLength(hull, True), True)

		if (approx.shape[0] != 4):
			print("approx.shape[0] != 4: " + str(approx.shape[0]))
			continue

		approx_area = cv2.contourArea(approx)

		if (approx_area < contour_area * 0.85 or approx_area > contour_area * 1.15):
			print("approx_area < contour_area * 0.85 or approx_area > contour_area * 1.15: " + str(approx_area))
			continue

		# if approx is not a rectangle, then skip it
		center = approx[0][0] + approx[1][0] + approx[2][0] + approx[3][0] / 4
		minimum = img.shape[0] * img.shape[1]
		maximum = 0

		for i in range(4):
			val = math.dist(approx[i][0], center)
			if (val < minimum):
				minimum = val
			if (val > maximum):
				maximum = val


		if (maximum > minimum * 1.3 or minimum * 1.3 < maximum):
			print("not isRectangle:" + str(maximum) + " " + str(minimum))
			continue

		print(approx)
		warped = GETPERSPECTIVEIMAGE(np.float32(approx), np.float32([[0, 0], [0, 200], [200, 200], [200, 0]]), img, (200, 200))

		# cv2.imshow("warped", warped)


		# loop over the image, pixel by pixel
		average = twoBitThreshold(warped)

		if average < 64:
			print("average is out of bounds", average)
			continue

		print("Contour is valid | avg ", average, "| area ", approx_area, "| contour area ", contour_area, "| approx rows ", approx.shape[0], "| Minimum Dis: ", minimum, "| Maximum Dis: ", maximum)

		# cv2.imshow("warped2", warped)

		copy = img.copy()
		copy = cv2.drawContours(copy, [approx], -1, (0, 255, 0), 10)
		# cv2.imshow("img", scaleImage(copy, (800, 600)))

		time = datetime.datetime.now().strftime("%H%M%S")
		cv2.imwrite("training/PXL_" + str(counter) + time + ".png", warped)

		# key = cv2.waitKey(0)
		# if key == ord('q'):
		# 	exit()
		counter += 1

	if pastCounter == counter:
		print("nope: " + image_file)
		# key = cv2.waitKey(0)
		# if key == ord('q'):
		# 	exit()
	counter += 1
